<?php

namespace App\Domain\Devices\Actions;

use App\Domain\Campaigns\Actions\ResolveCampaignTargets;
use App\Domain\Campaigns\Enums\CampaignStatus;
use App\Domain\Campaigns\Models\Campaign;
use App\Domain\Devices\Enums\ManifestStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceManifest;
use App\Domain\Media\Models\Layout;
use App\Domain\Playlists\Enums\PlaylistStatus;
use App\Domain\Playlists\Enums\PlaylistType;
use App\Domain\Playlists\Models\Playlist;
use Illuminate\Support\Collection;

class BuildDeviceManifest
{
    public function __construct(protected ResolveCampaignTargets $targets) {}

    /**
     * Compose a versioned content manifest. Assets are referenced with checksums
     * so the player only downloads what changed, and the previous manifest stays
     * active until the new one is fully downloaded.
     */
    public function handle(Device $device): DeviceManifest
    {
        $device->loadMissing(['business', 'location', 'currentLayout']);

        $layout = $device->currentLayout
            ?? Layout::query()->where('is_default', true)->first()
            ?? Layout::query()->first();

        $businessPlaylist = $this->businessPlaylist($device);

        $campaigns = $this->activeCampaigns($device);

        $assets = collect()
            ->merge($businessPlaylist?->items->pluck('mediaAsset') ?? collect())
            ->merge($campaigns->flatMap(fn (Campaign $c) => $c->creatives->pluck('mediaAsset')))
            ->filter()
            ->unique('id')
            ->values();

        $version = (string) now()->format('YmdHis');

        $payload = [
            'manifest_version' => $version,
            'generated_at' => now()->toIso8601String(),
            'device' => [
                'id' => $device->id,
                'uuid' => $device->uuid,
                'name' => $device->name,
                'timezone' => $device->business?->timezone,
            ],
            'layout' => $layout ? [
                'id' => $layout->id,
                'name' => $layout->name,
                'orientation' => $layout->orientation?->value,
                'business_percentage' => $layout->business_percentage,
                'advertising_percentage' => $layout->advertising_percentage,
                'configuration' => $layout->configuration,
            ] : null,
            'business_playlist' => $businessPlaylist ? $this->playlistPayload($businessPlaylist) : null,
            'advertising_playlist' => [
                'campaigns' => $campaigns->map(fn (Campaign $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'priority' => $c->priority,
                    'daily_start_time' => $c->daily_start_time,
                    'daily_end_time' => $c->daily_end_time,
                    'days_of_week' => $c->days_of_week,
                    'creatives' => $c->creatives->map(fn ($creative) => [
                        'creative_id' => $creative->id,
                        'media_asset_id' => $creative->media_asset_id,
                        'duration' => $creative->duration,
                        'weight' => $creative->weight,
                    ])->values(),
                ])->values(),
            ],
            'schedules' => $businessPlaylist?->schedules->map(fn ($s) => [
                'daily_start_time' => $s->daily_start_time,
                'daily_end_time' => $s->daily_end_time,
                'days_of_week' => $s->days_of_week,
                'priority' => $s->priority,
            ])->values() ?? [],
            'assets' => $assets->map(fn ($asset) => [
                'id' => $asset->id,
                'type' => $asset->type?->value,
                'url' => $asset->url,
                'checksum' => $asset->checksum,
                'mime_type' => $asset->mime_type,
                'duration' => $asset->duration,
                'filesize' => $asset->filesize,
            ])->values(),
            'configuration' => [
                'heartbeat_interval_seconds' => 60,
                'sync_interval_seconds' => 300,
                'offline_after_minutes' => config('signage.device.offline_after_minutes'),
            ],
        ];

        $checksum = hash('sha256', json_encode($payload));

        $device->manifests()
            ->where('status', ManifestStatus::Pending->value)
            ->update(['status' => ManifestStatus::Superseded->value]);

        $manifest = $device->manifests()->create([
            'version' => $version,
            'checksum' => $checksum,
            'payload' => $payload,
            'status' => ManifestStatus::Pending,
            'generated_at' => now(),
        ]);

        $device->forceFill(['pending_manifest_version' => $version])->save();

        return $manifest;
    }

    protected function businessPlaylist(Device $device): ?Playlist
    {
        return Playlist::query()
            ->where('business_id', $device->business_id)
            ->where('type', PlaylistType::Business->value)
            ->where('status', PlaylistStatus::Active->value)
            ->with(['items.mediaAsset', 'schedules'])
            ->first();
    }

    /**
     * @return Collection<int, Campaign>
     */
    protected function activeCampaigns(Device $device): Collection
    {
        return Campaign::query()
            ->where('status', CampaignStatus::Active->value)
            ->with(['creatives' => fn ($q) => $q->where('status', 'active'), 'creatives.mediaAsset'])
            ->get()
            ->filter(fn (Campaign $campaign) => $this->targets->devicesFor($campaign)->whereKey($device->id)->exists())
            ->sortByDesc('priority')
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    protected function playlistPayload(Playlist $playlist): array
    {
        return [
            'id' => $playlist->id,
            'name' => $playlist->name,
            'items' => $playlist->items->map(fn ($item) => [
                'id' => $item->id,
                'media_asset_id' => $item->media_asset_id,
                'order' => $item->sort_order,
                'duration' => $item->duration,
                'transition' => $item->transition,
            ])->values(),
        ];
    }
}
