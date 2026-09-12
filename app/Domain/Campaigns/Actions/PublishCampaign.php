<?php

namespace App\Domain\Campaigns\Actions;

use App\Domain\Campaigns\Enums\CampaignStatus;
use App\Domain\Campaigns\Events\CampaignPublished;
use App\Domain\Campaigns\Models\Campaign;
use App\Domain\Devices\Jobs\DeployCampaignToDevices;
use App\Domain\Operations\Actions\RaiseAlert;
use App\Domain\Operations\Enums\AlertSeverity;
use App\Domain\Operations\Enums\AlertType;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PublishCampaign
{
    public function __construct(
        protected ResolveCampaignTargets $targets,
        protected RaiseAlert $alerts,
    ) {}

    public function handle(Campaign $campaign): Campaign
    {
        $campaign->loadMissing(['creatives', 'targets']);

        if ($campaign->creatives->isEmpty()) {
            $this->alerts->handle(
                AlertType::CampaignWithoutCreatives,
                'Campaña sin creatividades',
                "La campaña «{$campaign->name}» no tiene creatividades asignadas.",
                AlertSeverity::Critical,
                $campaign,
            );

            throw ValidationException::withMessages([
                'creatives' => 'La campaña necesita al menos una creatividad activa.',
            ]);
        }

        if ($campaign->targets->isEmpty()) {
            $this->alerts->handle(
                AlertType::CampaignWithoutTargets,
                'Campaña sin pantallas objetivo',
                "La campaña «{$campaign->name}» no tiene segmentación definida.",
                AlertSeverity::Critical,
                $campaign,
            );

            throw ValidationException::withMessages([
                'targets' => 'La campaña necesita al menos una regla de segmentación.',
            ]);
        }

        $summary = $this->targets->summary($campaign);

        if ($summary['screens'] === 0) {
            $this->alerts->handle(
                AlertType::CampaignWithoutTargets,
                'Campaña sin pantallas activas',
                "La segmentación de «{$campaign->name}» no coincide con ninguna pantalla activa.",
                AlertSeverity::Critical,
                $campaign,
            );

            throw ValidationException::withMessages([
                'targets' => 'La segmentación no coincide con ninguna pantalla activa.',
            ]);
        }

        return DB::transaction(function () use ($campaign, $summary) {
            $campaign->forceFill([
                'status' => $this->targets->recommendedStatus($campaign),
                'target_screen_count' => $summary['screens'],
                'published_at' => now(),
                'last_activity_at' => now(),
            ])->save();

            $this->alerts->resolve(AlertType::CampaignWithoutCreatives, $campaign);
            $this->alerts->resolve(AlertType::CampaignWithoutTargets, $campaign);

            DeployCampaignToDevices::dispatch($campaign);

            CampaignPublished::dispatch($campaign);

            return $campaign->refresh();
        });
    }

    public function pause(Campaign $campaign): Campaign
    {
        $campaign->forceFill([
            'status' => CampaignStatus::Paused,
            'last_activity_at' => now(),
        ])->save();

        return $campaign;
    }

    public function resume(Campaign $campaign): Campaign
    {
        $campaign->forceFill([
            'status' => $this->targets->recommendedStatus($campaign),
            'last_activity_at' => now(),
        ])->save();

        return $campaign;
    }

    public function archive(Campaign $campaign): Campaign
    {
        $campaign->forceFill(['status' => CampaignStatus::Archived])->save();

        return $campaign;
    }
}
