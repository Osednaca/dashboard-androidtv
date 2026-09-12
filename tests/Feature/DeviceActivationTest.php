<?php

namespace Tests\Feature;

use App\Domain\Devices\Actions\AssignActivation;
use App\Domain\Devices\Models\DeviceActivation;
use App\Domain\Locations\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
