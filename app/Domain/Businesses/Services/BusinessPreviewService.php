<?php

namespace App\Domain\Businesses\Services;

use App\Domain\Campaigns\Actions\ResolveCampaignTargets;
use App\Domain\Campaigns\Enums\CampaignStatus;
use App\Domain\Campaigns\Models\Campaign;
use App\Domain\Devices\Models\Device;
use App\Domain\Media\Models\MediaAsset;
use App\Http\Presenters\EntityPresenter;

/**
 * Builds a visual simulation of what a screen is currently showing: business
 * content on one side and the administrator-controlled advertising on the other.
 * This never performs live streaming; it renders assigned content.
 */
class BusinessPreviewService
{
    public function __construct(protected ResolveCampaignTargets $targets) {}

    /**
     * @return array<string, mixed>
     */
    public function forDevice(Device $device): array
    {
        $device->loadMissing([
            'business',
            'location',
            'currentLayout',
            'currentPlaylist.items.mediaAsset',
        ]);

        $layout = $device->currentLayout;
        $playlist = $device->currentPlaylist;

        $businessMedia = $playlist?->items
            ->first(fn ($item) => $item->mediaAsset !== null)?->mediaAsset;

        if (! $businessMedia && $device->business) {
            $businessMedia = MediaAsset::query()
                ->where('owner_type', $device->business->getMorphClass())
                ->where('owner_id', $device->business_id)
                ->ready()
                ->latest()
                ->first();
        }

        $advertising = null;
        $campaign = $this->activeCampaignFor($device);

        if ($campaign) {
            $creative = $campaign->creatives->firstWhere('mediaAsset', '!=', null);
            if ($creative?->mediaAsset) {
                $advertising = [
                    'campaign_name' => $campaign->name,
                    'media' => EntityPresenter::mediaAsset($creative->mediaAsset),
                ];
            }
        }

        return [
            'device' => EntityPresenter::device($device),
            'layout' => $layout ? [
                'id' => $layout->id,
                'name' => $layout->name,
                'orientation' => $layout->orientation?->value,
                'business_percentage' => $layout->business_percentage,
                'advertising_percentage' => $layout->advertising_percentage,
                'ratio' => $layout->ratioLabel(),
            ] : null,
            'business_media' => $businessMedia ? EntityPresenter::mediaAsset($businessMedia) : null,
            'advertising' => $advertising,
            'playlist' => $playlist ? ['id' => $playlist->id, 'name' => $playlist->name] : null,
            'last_sync_at' => $device->last_sync_at?->toIso8601String(),
        ];
    }

    protected function activeCampaignFor(Device $device): ?Campaign
    {
        return Campaign::query()
            ->where('status', CampaignStatus::Active->value)
            ->with([
                'creatives' => fn ($query) => $query->where('status', 'active'),
                'creatives.mediaAsset',
            ])
            ->get()
            ->first(fn (Campaign $campaign) => $this->targets->devicesFor($campaign)->whereKey($device->id)->exists());
    }
}
