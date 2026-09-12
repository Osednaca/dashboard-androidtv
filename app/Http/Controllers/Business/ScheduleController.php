<?php

namespace App\Http\Controllers\Business;

use App\Domain\Playlists\Models\Playlist;
use App\Domain\Scheduling\Models\ContentSchedule;
use App\Http\Controllers\Business\Concerns\AuthorizesBusiness;
use App\Http\Controllers\Controller;
use App\Http\Presenters\EntityPresenter;
use App\Http\Requests\Business\ScheduleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    use AuthorizesBusiness;

    public function index(Request $request): Response
    {
        $business = $this->business();

        $schedules = $business->schedules()
            ->with(['playlist', 'location'])
            ->orderBy('daily_start_time')
            ->get()
            ->map(fn (ContentSchedule $schedule) => EntityPresenter::contentSchedule($schedule));

        return Inertia::render('Business/Schedule/Index', [
            'schedules' => $schedules->values()->all(),
            'playlists' => $business->playlists()
                ->where('type', 'business')
                ->with(['items.mediaAsset'])
                ->orderBy('name')
                ->get()
                ->map(fn (Playlist $playlist) => EntityPresenter::playlistSummary($playlist))
                ->values()
                ->all(),
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

        $this->business()->schedules()->create($data);

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

        $schedule->update($data);

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

        return back()->with('success', 'Programación eliminada.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validated(ScheduleRequest $request): array
    {
        $data = $request->validated();

        $playlist = Playlist::query()->findOrFail($data['playlist_id']);
        $this->authorizeOwned($playlist);

        if (! empty($data['location_id'])) {
            $location = $this->business()->locations()->findOrFail($data['location_id']);
            $data['location_id'] = $location->id;
        }

        $data['status'] = $data['status'] ?? 'active';
        $data['days_of_week'] = $data['days_of_week'] ?? null;
        $data['priority'] = $data['priority'] ?? 0;

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
