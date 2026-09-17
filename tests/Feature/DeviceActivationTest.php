<?php

namespace Tests\Feature;

use App\Domain\Devices\Actions\AssignActivation;
use App\Domain\Devices\Models\DeviceActivation;
use App\Domain\Locations\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DeviceActivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_device_can_request_an_activation_code(): void
    {
        $response = $this->postJson('/api/v1/device/activation/request', [
            'device_uuid' => '11111111-1111-4111-8111-111111111111',
            'app_version' => '1.6.2',
        ]);

        $response->assertOk()->assertJsonStructure(['activation_code', 'status', 'expires_at']);

        $this->assertDatabaseHas('device_activations', [
            'device_uuid' => '11111111-1111-4111-8111-111111111111',
            'status' => 'pending',
        ]);

        $this->assertSame(6, strlen($response->json('activation_code')));
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $response->json('expires_at'));
    }

    public function test_existing_activation_returns_expiry_in_utc_z_format_without_changing_its_instant(): void
    {
        $this->travelTo(Carbon::parse('2026-09-17T19:52:02Z'));

        DeviceActivation::query()->create([
            'code' => 'ABC234',
            'device_uuid' => '66666666-6666-4666-8666-666666666666',
            'status' => 'pending',
            'expires_at' => now()->addHour(),
        ]);

        $this->postJson('/api/v1/device/activation/request', [
            'device_uuid' => '66666666-6666-4666-8666-666666666666',
        ])->assertOk()
            ->assertJsonPath('activation_code', 'ABC234')
            ->assertJsonPath('expires_at', '2026-09-17T20:52:02Z');

        $activation = DeviceActivation::query()->sole();
        $this->assertSame('2026-09-17T20:52:02+00:00', $activation->expires_at->toIso8601String());
    }

    public function test_requesting_twice_returns_the_same_pending_code(): void
    {
        $payload = ['device_uuid' => '22222222-2222-4222-8222-222222222222'];

        $first = $this->postJson('/api/v1/device/activation/request', $payload)->json('activation_code');
        $second = $this->postJson('/api/v1/device/activation/request', $payload)->json('activation_code');

        $this->assertSame($first, $second);
    }

    public function test_a_device_can_confirm_activation_and_receive_a_token(): void
    {
        $location = Location::factory()->create();

        $activation = DeviceActivation::query()->create([
            'code' => 'ABC123',
            'device_uuid' => '33333333-3333-4333-8333-333333333333',
            'status' => 'pending',
            'expires_at' => now()->addHour(),
        ]);

        app(AssignActivation::class)->handle($activation, $location->business_id, $location->id, 'Pantalla Test');

        $response = $this->postJson('/api/v1/device/activation/confirm', [
            'code' => 'abc123',
            'device_uuid' => '33333333-3333-4333-8333-333333333333',
            'app_version' => '1.6.2',
        ]);

        $response->assertCreated()->assertJsonStructure(['token', 'token_type', 'device']);

        $this->assertDatabaseHas('devices', [
            'name' => 'Pantalla Test',
            'business_id' => $location->business_id,
            'location_id' => $location->id,
        ]);

        $this->assertDatabaseHas('device_activations', ['id' => $activation->id, 'status' => 'claimed']);
    }

    public function test_activation_fails_when_code_is_not_assigned_to_a_business(): void
    {
        DeviceActivation::query()->create([
            'code' => 'ZZZ999',
            'status' => 'pending',
            'expires_at' => now()->addHour(),
        ]);

        $this->postJson('/api/v1/device/activation/confirm', [
            'code' => 'ZZZ999',
            'device_uuid' => '44444444-4444-4444-8444-444444444444',
        ])->assertStatus(422);
    }

    public function test_expired_codes_cannot_be_confirmed(): void
    {
        DeviceActivation::query()->create([
            'code' => 'OLD000',
            'status' => 'pending',
            'expires_at' => now()->subMinute(),
        ]);

        $this->postJson('/api/v1/device/activation/confirm', [
            'code' => 'OLD000',
            'device_uuid' => '55555555-5555-4555-8555-555555555555',
        ])->assertStatus(422);
    }

    public function test_unassigned_activation_returns_json_without_an_accept_header(): void
    {
        DeviceActivation::query()->create([
            'code' => 'ZZZ999',
            'status' => 'pending',
            'expires_at' => now()->addHour(),
        ]);

        $this->call('POST', '/api/v1/device/activation/confirm', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'code' => 'ZZZ999',
            'device_uuid' => '44444444-4444-4444-8444-444444444444',
        ]))->assertUnprocessable()
            ->assertHeader('Content-Type', 'application/json')
            ->assertJsonValidationErrors('code');
    }

    public function test_unknown_api_routes_return_json_without_an_accept_header(): void
    {
        $this->get('/api/v1/device/unknown')
            ->assertNotFound()
            ->assertHeader('Content-Type', 'application/json');
    }
}
