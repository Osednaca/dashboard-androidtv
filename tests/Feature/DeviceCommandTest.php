<?php

namespace Tests\Feature;

use App\Domain\Devices\Models\Device;
use App\Domain\Users\Enums\RoleEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesUsers;
use Tests\TestCase;

class DeviceCommandTest extends TestCase
{
    use CreatesUsers, RefreshDatabase;

    public function test_an_administrator_can_queue_a_device_command(): void
    {
        $device = Device::factory()->create();

        $this->actingAs($this->superAdmin())
            ->post("/admin/devices/{$device->id}/commands", ['command' => 'SYNC_CONTENT'])
            ->assertRedirect();

        $this->assertDatabaseHas('device_commands', [
            'device_id' => $device->id,
            'command' => 'SYNC_CONTENT',
            'status' => 'pending',
        ]);
    }

    public function test_devices_poll_and_complete_commands(): void
    {
        $device = Device::factory()->create();

        $this->actingAs($this->superAdmin())
            ->post("/admin/devices/{$device->id}/commands", ['command' => 'REFRESH_MANIFEST'])
            ->assertRedirect();

        $token = $device->issueToken();
        $headers = ['Authorization' => "Bearer {$token}"];

        $list = $this->withHeaders($headers)->getJson('/api/v1/device/commands');
        $list->assertOk();
        $commandId = $list->json('commands.0.id');

        $this->assertNotNull($commandId);
        $this->assertDatabaseHas('device_commands', ['id' => $commandId, 'status' => 'sent']);

        $this->withHeaders($headers)
            ->postJson("/api/v1/device/commands/{$commandId}/result", [
                'status' => 'completed',
                'result' => ['version' => '20260912130000'],
            ])
            ->assertOk();

        $this->assertDatabaseHas('device_commands', ['id' => $commandId, 'status' => 'completed']);
    }

    public function test_a_device_cannot_report_results_for_another_device(): void
    {
        $device = Device::factory()->create();
        $other = Device::factory()->create();

        $this->actingAs($this->superAdmin())
            ->post("/admin/devices/{$device->id}/commands", ['command' => 'MUTE']);

        $command = $device->commands()->firstOrFail();
        $token = $other->issueToken();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/device/commands/{$command->id}/result", ['status' => 'completed'])
            ->assertNotFound();
    }

    public function test_issuing_a_command_requires_permission(): void
    {
        $device = Device::factory()->create();
        $support = $this->userWithRole(RoleEnum::Support);

        $this->actingAs($support)
            ->post("/admin/devices/{$device->id}/commands", ['command' => 'CLEAR_CACHE'])
            ->assertForbidden();
    }
}
