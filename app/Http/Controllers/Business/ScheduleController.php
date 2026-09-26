<?php

namespace App\Http\Controllers\Business;

use App\Domain\Playlists\Models\Playlist;
use App\Domain\Playlists\Models\PlaylistItem;
use App\Domain\Scheduling\Jobs\RefreshBusinessManifests;
use App\Domain\Scheduling\Models\ContentSchedule;
use App\Http\Controllers\Business\Concerns\AuthorizesBusiness;
use App\Http\Controllers\Controller;
use App\Http\Presenters\EntityPresenter;
use App\Http\Requests\Business\ScheduleRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    use AuthorizesBusiness;

    public function index(Request $request): Response
    {
        $business = $this->business();
        $canViewContent = $request->user()->hasPermission('business.media.view')
            && $request->user()->hasPermission('business.playlists.view');

        $schedules = $business->schedules()
            ->with($canViewContent ? ['playlist.items.mediaAsset', 'location', 'business'] : ['playlist', 'location', 'business'])
            ->orderBy('daily_start_time')
            ->get()
            ->map(fn (ContentSchedule $schedule) => EntityPresenter::contentSchedule($schedule));

        return Inertia::render('Business/Schedule/Index', [
            'schedules' => $schedules->values()->all(),
            'legacyPlaylists' => ! $canViewContent ? [] : $business->playlists()
                ->where('type', 'business')
                ->where('is_schedule_managed', false)
                ->with(['items.mediaAsset'])
                ->orderBy('name')
                ->get()
                ->map(fn (Playlist $playlist) => [
                    'id' => $playlist->id,
                    'name' => $playlist->name,
                    'items' => $playlist->items->map(fn (PlaylistItem $item) => EntityPresenter::playlistItem($item))->values()->all(),
                ])
                ->values()
                ->all(),
            'availableMedia' => ! $canViewContent ? [] : $this->businessMediaQuery()->ready()
                ->whereIn('type', ['image', 'video'])->latest()->limit(100)->get()
                ->map(fn ($media) => EntityPresenter::mediaAsset($media))->values()->all(),
            'transitions' => PlaylistItem::transitionOptions(),
            'locations' => $business->locations()
                ->orderBy('name')
                ->get(['id', 'name', 'city'])
                ->map(fn ($location) => ['id' => $location->id, 'name' => $location->name, 'city' => $location->city])
                ->values()
                ->all(),
        ]);
    }

    public function store(ScheduleRequest $request): RedirectResponse
    {
        $data = $this->validated($request);

        $overlap = $this->findOverlap($data);

        DB::transaction(function () use ($data) {
            $this->business()->schedules()->create($this->withIndependentContent($data));
            RefreshBusinessManifests::dispatch($this->businessId())->afterCommit();
        });

        return back()->with(
            $overlap ? 'info' : 'success',
            $overlap
                ? "Programación guardada con advertencia: se cruza con «{$overlap->name}» en el mismo horario."
                : 'Programación creada.',
        );
    }

    public function update(ScheduleRequest $request, ContentSchedule $schedule): RedirectResponse
    {
        $this->authorizeOwned($schedule);

        $data = $this->validated($request);
        $overlap = $this->findOverlap($data, $schedule);

        DB::transaction(function () use ($schedule, $data) {
            $locked = $this->business()->schedules()->lockForUpdate()->findOrFail($schedule->id);
            $locked->update($this->withIndependentContent($data, $locked));
            // Refresh both the previous and new locations, including moves to/from all locations.
            RefreshBusinessManifests::dispatch($this->businessId())->afterCommit();
        });

        return back()->with(
            $overlap ? 'info' : 'success',
            $overlap
                ? "Programación actualizada con advertencia: se cruza con «{$overlap->name}»."
                : 'Programación actualizada.',
        );
    }

    public function destroy(ContentSchedule $schedule): RedirectResponse
    {
        $this->authorizeOwned($schedule);

        $schedule->delete();

        // Keep playlist/media history; managed playlists never become fallback content.
        RefreshBusinessManifests::dispatch($this->businessId());

        return back()->with('success', 'Programación eliminada.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validated(ScheduleRequest $request): array
    {
        $data = $request->validated();

        if (isset($data['playlist_id'])) {
            $playlist = Playlist::query()->findOrFail($data['playlist_id']);
            $this->authorizeOwned($playlist);
        }

        if (! empty($data['location_id'])) {
            $location = $this->business()->locations()->findOrFail($data['location_id']);
            $data['location_id'] = $location->id;
        }

        $data['status'] = $data['status'] ?? 'active';
        $data['days_of_week'] = $data['days_of_week'] ?? null;
        $data['priority'] = $data['priority'] ?? 0;

        return $data;
    }

    public function mediaStatus(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasPermission('business.media.view'), 403);
        $data = $request->validate(['ids' => ['required', 'array', 'min:1', 'max:100'], 'ids.*' => ['integer']]);

        return response()->json(['media' => $this->businessMediaQuery()->whereIn('id', $data['ids'])
            ->whereIn('type', ['image', 'video'])->get()
            ->map(fn ($media) => EntityPresenter::mediaAsset($media))->values()->all()]);
    }

    public function media(Request $request): JsonResponse
    {
        $request->validate(['search' => ['nullable', 'string', 'max:120'], 'page' => ['nullable', 'integer', 'min:1']]);

        return response()->json(['media' => $this->businessMediaQuery()->ready()->whereIn('type', ['image', 'video'])
            ->search($request->string('search')->toString())->orderByDesc('id')->paginate(24)->withQueryString()
            ->through(fn ($media) => EntityPresenter::mediaAsset($media))]);
    }

    /** Save only validated, independent content; never rewrite a legacy shared list. */
    private function withIndependentContent(array $data, ?ContentSchedule $schedule = null): array
    {
        if (! array_key_exists('items', $data)) {
            // Legacy timing-only clients cannot detach an owned schedule from its managed list.
            if ($schedule?->playlist?->is_schedule_managed) {
                throw ValidationException::withMessages(['items' => 'Edita el contenido desde Programación.']);
            }

            return $data;
        }

        $items = $data['items'];
        unset($data['items']);
        $ids = array_unique(array_column($items, 'media_asset_id'));
        $readyIds = $this->businessMediaQuery()->whereIn('id', $ids)->whereIn('type', ['image', 'video'])
            ->ready()->lockForUpdate()->pluck('id')->all();
        foreach ($items as $index => $item) {
            if (! in_array((int) $item['media_asset_id'], $readyIds, true)) {
                throw ValidationException::withMessages(["items.{$index}.media_asset_id" => 'El archivo no está disponible o aún se está procesando.']);
            }
        }

        $playlist = $schedule?->playlist;
        if (! $playlist?->is_schedule_managed) {
            $playlist = $this->business()->playlists()->create([
                'name' => $data['name'], 'type' => 'business', 'status' => 'active', 'is_schedule_managed' => true,
            ]);
        } else {
            $this->authorizeOwned($playlist);
            $playlist->update(['name' => $data['name']]);
            $playlist->items()->delete();
        }
        foreach (array_values($items) as $position => $item) {
            $playlist->items()->create([
                'media_asset_id' => $item['media_asset_id'], 'duration' => $item['duration_seconds'],
                'transition' => $item['transition'], 'sort_order' => $position,
            ]);
        }
        $data['playlist_id'] = $playlist->id;

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function findOverlap(array $data, ?ContentSchedule $ignore = null): ?ContentSchedule
    {
        $start = $data['daily_start_time'] ?? null;
        $end = $data['daily_end_time'] ?? null;

        if (! $start || ! $end) {
            return null;
        }

        $start = strlen($start) === 5 ? $start.':00' : $start;
        $end = strlen($end) === 5 ? $end.':00' : $end;
        $days = $data['days_of_week'] ?? [];

        return $this->business()->schedules()
            ->where('status', 'active')
            ->where('location_id', $data['location_id'] ?? null)
            ->when($ignore, fn ($query) => $query->whereKeyNot($ignore->getKey()))
            ->get()
            ->first(function (ContentSchedule $schedule) use ($start, $end, $days) {
                if (! $schedule->daily_start_time || ! $schedule->daily_end_time) {
                    return false;
                }

                if (! ($start < $schedule->daily_end_time && $end > $schedule->daily_start_time)) {
                    return false;
                }

                $scheduleDays = $schedule->days_of_week ?? [];

                return $days === [] || $scheduleDays === [] || count(array_intersect($days, $scheduleDays)) > 0;
            });
    }
}
