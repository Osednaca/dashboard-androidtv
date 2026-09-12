<?php

namespace App\Http\Controllers\Admin;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Locations\Enums\LocationStatus;
use App\Domain\Locations\Models\Location;
use App\Domain\Operations\Actions\RecordAudit;
use App\Http\Controllers\Controller;
use App\Http\Presenters\EntityPresenter;
use App\Http\Requests\Admin\LocationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Location::class);

        $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
            'business_id' => ['nullable', 'integer'],
        ]);

        $locations = Location::query()
            ->search($request->string('search')->toString())
            ->when($request->filled('city'), fn ($q) => $q->where('city', $request->string('city')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('business_id'), fn ($q) => $q->where('business_id', $request->integer('business_id')))
            ->with('business')
            ->withCount([
                'devices',
                'devices as online_devices_count' => fn ($q) => $q->where('status', DeviceStatus::Online->value),
            ])
            ->orderBy('city')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Location $location) => EntityPresenter::location($location));

        return Inertia::render('Admin/Locations/Index', [
            'locations' => $locations,
            'filters' => $request->only('search', 'city', 'status', 'business_id'),
            'options' => [
                'statuses' => collect(LocationStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()])->all(),
                'cities' => Location::query()->distinct()->orderBy('city')->pluck('city'),
                'businesses' => DB::table('businesses')->orderBy('name')->get(['id', 'name']),
            ],
        ]);
    }

    public function store(LocationRequest $request): RedirectResponse
    {
        Location::query()->create($request->validated());

        return back()->with('success', 'Ubicación creada.');
    }

    public function show(Location $location): Response
    {
        $this->authorize('view', $location);

        $location->load('business')->loadCount([
            'devices',
            'devices as online_devices_count' => fn ($q) => $q->where('status', DeviceStatus::Online->value),
        ]);

        $devices = $location->devices()->with(['currentLayout', 'currentPlaylist'])->latest()->get()
            ->map(fn ($device) => EntityPresenter::device($device));

        return Inertia::render('Admin/Locations/Show', [
            'location' => EntityPresenter::location($location),
            'devices' => $devices,
        ]);
    }

    public function update(LocationRequest $request, Location $location): RedirectResponse
    {
        $location->update($request->validated());

        app(RecordAudit::class)->handle('location.updated', $location);

        return back()->with('success', 'Ubicación actualizada.');
    }

    public function destroy(Location $location): RedirectResponse
    {
        $this->authorize('delete', $location);

        $location->delete();

        return back()->with('success', 'Ubicación eliminada.');
    }
}
