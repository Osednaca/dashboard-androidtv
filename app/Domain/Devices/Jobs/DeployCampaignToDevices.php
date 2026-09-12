<?php

namespace App\Domain\Devices\Jobs;

use App\Domain\Campaigns\Actions\ResolveCampaignTargets;
use App\Domain\Campaigns\Models\Campaign;
use App\Domain\Devices\Actions\BuildDeviceManifest;
use App\Domain\Devices\Models\Device;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class DeployCampaignToDevices implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public Campaign $campaign) {}

    public function handle(ResolveCampaignTargets $targets, BuildDeviceManifest $manifestBuilder): void
    {
        $deviceIds = $targets->devicesFor($this->campaign)->pluck('id');

        $deviceIds->chunk(100)->each(function ($chunk) use ($manifestBuilder) {
            Device::query()
                ->whereIn('id', $chunk)
                ->with(['business', 'location', 'currentLayout'])
                ->each(function ($device) use ($manifestBuilder) {
                    try {
                        $manifestBuilder->handle($device);
                    } catch (\Throwable $e) {
                        Log::warning('Manifest build failed during campaign deploy', [
                            'device_id' => $device->id,
                            'campaign_id' => $this->campaign->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                });
        });
    }
}
