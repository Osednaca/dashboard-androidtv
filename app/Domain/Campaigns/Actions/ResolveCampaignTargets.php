<?php

namespace App\Domain\Campaigns\Actions;

use App\Domain\Businesses\Models\Business;
use App\Domain\Campaigns\Enums\CampaignStatus;
use App\Domain\Campaigns\Enums\CampaignTargetType;
use App\Domain\Campaigns\Models\Campaign;
use App\Domain\Campaigns\Models\CampaignTarget;
use App\Domain\Devices\Models\Device;
use App\Domain\Locations\Models\Location;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ResolveCampaignTargets
{
    /**
     * Build a device query for the campaign's inclusion/exclusion rules.
     *
     * @return Builder<Device>
     */
    public function devicesFor(Campaign $campaign): Builder
    {
        $targets = $campaign->targets()->get();

        if ($targets->isEmpty()) {
            return Device::query()->whereRaw('1 = 0');
        }

        $inclusions = $targets->where('is_exclusion', false);
        $exclusions = $targets->where('is_exclusion', true);

        $query = Device::query();

        if ($inclusions->isNotEmpty()) {
            $query->where(function (Builder $query) use ($inclusions) {
                foreach ($inclusions->groupBy(fn (CampaignTarget $t) => $t->target_type->value) as $type => $group) {
                    $this->applyCondition($query, CampaignTargetType::from($type), $group, true);
                }
            });
        }

        foreach ($exclusions->groupBy(fn (CampaignTarget $t) => $t->target_type->value) as $type => $group) {
            $this->applyCondition($query, CampaignTargetType::from($type), $group, false);
        }

        return $query->whereNotIn('devices.status', ['disabled', 'pending_activation']);
    }

    /**
     * @return array{screens: int, businesses: int, locations: int, cities: int}
     */
    public function summary(Campaign $campaign): array
    {
        $query = $this->devicesFor($campaign);

        return [
            'screens' => (clone $query)->count(),
            'businesses' => (clone $query)->distinct()->count('business_id'),
            'locations' => (clone $query)->whereNotNull('location_id')->distinct()->count('location_id'),
            'cities' => (clone $query)
                ->join('locations', 'locations.id', '=', 'devices.location_id')
                ->distinct()
                ->count('locations.city'),
        ];
    }

    /**
     * @param  Collection<int, CampaignTarget>  $targets
     * @param  Builder<Device>  $query
     */
    protected function applyCondition(Builder $query, CampaignTargetType $type, $targets, bool $inclusive): void
    {
        $ids = $targets->pluck('target_id')->filter()->values();
        $values = $targets->pluck('target_value')->filter()->values();

        match ($type) {
            CampaignTargetType::Device => $inclusive
                ? $query->orWhereIn('devices.id', $ids)
                : $query->whereNotIn('devices.id', $ids),
            CampaignTargetType::Business => $inclusive
                ? $query->orWhereIn('devices.business_id', $ids)
                : $query->whereNotIn('devices.business_id', $ids),
            CampaignTargetType::Location => $inclusive
                ? $query->orWhereIn('devices.location_id', $ids)
                : $query->whereNotIn('devices.location_id', $ids),
            CampaignTargetType::BusinessCategory => $inclusive
                ? $query->orWhereIn('devices.business_id', Business::query()->whereIn('category', $values)->select('id'))
                : $query->whereNotIn('devices.business_id', Business::query()->whereIn('category', $values)->select('id')),
            CampaignTargetType::City => $inclusive
                ? $query->orWhereIn('devices.location_id', Location::query()->whereIn('city', $values)->select('id'))
                : $query->whereNotIn('devices.location_id', Location::query()->whereIn('city', $values)->select('id')),
            CampaignTargetType::State => $inclusive
                ? $query->orWhereIn('devices.location_id', Location::query()->whereIn('state', $values)->select('id'))
                : $query->whereNotIn('devices.location_id', Location::query()->whereIn('state', $values)->select('id')),
            CampaignTargetType::Country => $inclusive
                ? $query->orWhereIn('devices.location_id', Location::query()->whereIn('country', $values)->select('id'))
                : $query->whereNotIn('devices.location_id', Location::query()->whereIn('country', $values)->select('id')),
        };
    }

    public function recommendedStatus(Campaign $campaign): CampaignStatus
    {
        if ($campaign->ends_at && $campaign->ends_at->isBefore(today())) {
            return CampaignStatus::Completed;
        }

        if ($campaign->starts_at && $campaign->starts_at->isAfter(today())) {
            return CampaignStatus::Scheduled;
        }

        return CampaignStatus::Active;
    }
}
