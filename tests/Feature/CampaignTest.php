<?php

namespace Tests\Feature;

use App\Domain\Advertisers\Models\Advertiser;
use App\Domain\Campaigns\Actions\ResolveCampaignTargets;
use App\Domain\Campaigns\Enums\CampaignStatus;
use App\Domain\Campaigns\Models\Campaign;
use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Locations\Models\Location;
use App\Domain\Media\Models\MediaAsset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesUsers;
use Tests\TestCase;

class CampaignTest extends TestCase
{
    use CreatesUsers, RefreshDatabase;

    public function test_a_campaign_can_be_created_with_creatives_and_targets(): void
    {
        $advertiser = Advertiser::factory()->create();
        $media = MediaAsset::factory()->create();

        $this->actingAs($this->superAdmin())
            ->post('/admin/campaigns', [
                'advertiser_id' => $advertiser->id,
                'name' => 'Campaña Verano',
                'description' => 'Promoción de temporada',
                'starts_at' => today()->toDateString(),
                'ends_at' => today()->addMonth()->toDateString(),
                'daily_start_time' => '08:00',
                'daily_end_time' => '20:00',
                'days_of_week' => [1, 2, 3, 4, 5],
                'priority' => 7,
                'creatives' => [
                    ['media_asset_id' => $media->id, 'duration' => 12, 'weight' => 10],
                ],
                'targets' => [
                    ['target_type' => 'city', 'target_value' => 'Bogotá', 'is_exclusion' => false],
                ],
            ])
            ->assertRedirect();

        $campaign = Campaign::query()->where('name', 'Campaña Verano')->firstOrFail();

        $this->assertSame(CampaignStatus::Draft, $campaign->status);
        $this->assertCount(1, $campaign->creatives);
        $this->assertCount(1, $campaign->targets);
    }

    public function test_campaign_targeting_resolves_matching_devices(): void
    {
        $location = Location::factory()->create(['city' => 'Medellín']);
        Device::factory()->create([
            'business_id' => $location->business_id,
            'location_id' => $location->id,
            'status' => DeviceStatus::Online,
        ]);

        $campaign = Campaign::factory()->create(['advertiser_id' => Advertiser::factory()]);
        $campaign->targets()->create(['target_type' => 'city', 'target_value' => 'Medellín']);

        $resolved = app(ResolveCampaignTargets::class)->devicesFor($campaign->fresh('targets'))->count();

        $this->assertSame(1, $resolved);
        $this->assertSame(1, app(ResolveCampaignTargets::class)->summary($campaign->fresh('targets'))['screens']);
    }

    public function test_a_campaign_can_be_published_and_target_screens_are_calculated(): void
    {
        $location = Location::factory()->create(['city' => 'Cali']);
        Device::factory()->create([
            'business_id' => $location->business_id,
            'location_id' => $location->id,
            'status' => DeviceStatus::Online,
        ]);

        $campaign = Campaign::factory()->create([
            'advertiser_id' => Advertiser::factory(),
            'status' => CampaignStatus::Draft,
        ]);
        $campaign->creatives()->create([
            'media_asset_id' => MediaAsset::factory()->create()->id,
            'duration' => 10,
            'weight' => 10,
            'status' => 'active',
        ]);
        $campaign->targets()->create(['target_type' => 'city', 'target_value' => 'Cali']);

        $this->actingAs($this->superAdmin())
            ->post("/admin/campaigns/{$campaign->id}/publish")
            ->assertRedirect();

        $campaign->refresh();
        $this->assertContains($campaign->status, [CampaignStatus::Active, CampaignStatus::Scheduled]);
        $this->assertSame(1, $campaign->target_screen_count);
    }

    public function test_publishing_without_creatives_fails(): void
    {
        $campaign = Campaign::factory()->create([
            'advertiser_id' => Advertiser::factory(),
        ]);
        $campaign->targets()->create(['target_type' => 'city', 'target_value' => 'Bogotá']);

        $this->actingAs($this->superAdmin())
            ->post("/admin/campaigns/{$campaign->id}/publish")
            ->assertSessionHasErrors('creatives');
    }
}
