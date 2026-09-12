<?php

namespace App\Http\Controllers\Business;

use App\Domain\Playlists\Enums\PlaylistStatus;
use App\Domain\Playlists\Enums\PlaylistType;
use App\Domain\Playlists\Models\Playlist;
use App\Domain\Playlists\Models\PlaylistItem;
use App\Http\Controllers\Business\Concerns\AuthorizesBusiness;
use App\Http\Controllers\Controller;
use App\Http\Presenters\EntityPresenter;
use App\Http\Requests\Business\PlaylistRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlaylistController extends Controller
{
    use AuthorizesBusiness;

    public function index(Request $request): Response
    {
        $request->validate(['search' => ['nullable', 'string', 'max:120']]);

        $playlists = $this->business()
            ->playlists()
            ->where('type', PlaylistType::Business->value)
            ->search($request->string('search')->toString())
            ->with(['items.mediaAsset'])
            ->orderBy('name')
            ->get()
            ->map(fn (Playlist $playlist) => EntityPresenter::playlistSummary($playlist));

        return Inertia::render('Business/Playlists/Index', [
            'playlists' => $playlists->values()->all(),
            'filters' => $request->only('search'),
        ]);
    }

    public function store(PlaylistRequest $request): RedirectResponse
    {
        $playlist = $this->business()->playlists()->create([
            'name' => $request->string('name')->toString(),
            'type' => PlaylistType::Business,
            'status' => PlaylistStatus::Draft,
        ]);

        return redirect()
            ->route('business.playlists.show', $playlist)
            ->with('success', 'Lista de reproducción creada.');
    }

    public function show(Playlist $playlist): Response
    {
        $this->authorizeOwned($playlist);

        $playlist->load(['items.mediaAsset']);

        return Inertia::render('Business/Playlists/Show', [
            'playlist' => EntityPresenter::playlistSummary($playlist),
            'items' => $playlist->items
                ->map(fn (PlaylistItem $item) => EntityPresenter::playlistItem($item))
                ->values()
                ->all(),
            'availableMedia' => $this->businessMediaQuery()
                ->ready()
                ->latest()
                ->limit(100)
                ->get()
                ->map(fn ($media) => EntityPresenter::mediaAsset($media))
                ->values()
                ->all(),
            'transitions' => PlaylistItem::transitionOptions(),
        ]);
    }

    public function update(PlaylistRequest $request, Playlist $playlist): RedirectResponse
    {
        $this->authorizeOwned($playlist);

        $playlist->update([
            'name' => $request->string('name')->toString(),
            'status' => $request->filled('status') ? $request->string('status')->toString() : $playlist->status,
        ]);

        return back()->with('success', 'Lista actualizada.');
    }

    public function duplicate(Playlist $playlist): RedirectResponse
    {
        $this->authorizeOwned($playlist);

        $copy = DB::transaction(function () use ($playlist) {
            $copy = $this->business()->playlists()->create([
                'name' => $playlist->name.' (copia)',
                'type' => PlaylistType::Business,
                'status' => PlaylistStatus::Draft,
            ]);

            foreach ($playlist->items as $item) {
                $copy->items()->create([
                    'media_asset_id' => $item->media_asset_id,
                    'sort_order' => $item->sort_order,
                    'duration' => $item->duration,
                    'transition' => $item->transition,
                    'configuration' => $item->configuration,
                ]);
            }

            return $copy;
        });

        return redirect()
            ->route('business.playlists.show', $copy)
            ->with('success', 'Lista duplicada.');
    }

    public function destroy(Playlist $playlist): RedirectResponse
    {
        $this->authorizeOwned($playlist);

        $playlist->items()->delete();
        $playlist->schedules()->delete();
        $playlist->delete();

        return redirect()
            ->route('business.playlists.index')
            ->with('success', 'Lista eliminada.');
    }
}
