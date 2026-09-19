<?php

namespace Tests\Feature;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Operations\Models\AuditLog;
use App\Domain\Users\Enums\RoleEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\CreatesUsers;
use Tests\TestCase;

class DeviceAdminPinTest extends TestCase
{
    use CreatesUsers, RefreshDatabase;

    public function test_admin_sets_and_rotates_a_hashed_pin_without_exposing_it(): void
    {
        $device = Device::factory()->create();
        $this->actingAs($this->superAdmin())->post("/admin/devices/{$device->id}/admin-pin", [
            'pin' => '012345', 'pin_confirmation' => '012345',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $device->refresh();
        $this->assertTrue(Hash::check('012345', $device->admin_pin_hash));
        $this->assertArrayNotHasKey('admin_pin_hash', $device->toArray());
        $this->get("/admin/devices/{$device->id}")->assertOk()
            ->assertInertia(fn ($page) => $page->where('adminPinConfigured', true)->where('canManagePin', true)->missing('device.admin_pin_hash'));
        $audit = AuditLog::query()->where('action', 'device.admin_pin.updated')->sole();
        $this->assertNull($audit->new_values);
        $this->assertNull($audit->old_values);

        $this->post("/admin/devices/{$device->id}/admin-pin", [
            'pin' => '654321', 'pin_confirmation' => '654321',
        ])->assertSessionHasNoErrors();
        $this->assertFalse(Hash::check('012345', $device->fresh()->admin_pin_hash));
        $this->assertTrue(Hash::check('654321', $device->fresh()->admin_pin_hash));
    }

    public function test_pin_management_requires_permission_and_does_not_flash_invalid_pins(): void
    {
        $device = Device::factory()->create();
        $this->actingAs($this->userWithRole(RoleEnum::Support))->post("/admin/devices/{$device->id}/admin-pin", [
            'pin' => '123456', 'pin_confirmation' => '123456',
        ])->assertForbidden();
        $this->assertNull($device->fresh()->admin_pin_hash);
        $this->actingAs($this->superAdmin());
        foreach (['', '12345', 'abcdef', '１２３４５６', ' 123456 ', '123456'] as $pin) {
            $this->post("/admin/devices/{$device->id}/admin-pin", [
                'pin' => $pin, 'pin_confirmation' => 'different',
            ])->assertSessionHasErrors('pin')->assertSessionMissing('_old_input.pin')->assertSessionMissing('_old_input.pin_confirmation');
        }
        $this->assertNull($device->fresh()->admin_pin_hash);
    }

    public function test_device_requires_its_own_pin_and_an_authenticated_active_token(): void
    {
        $device = Device::factory()->online()->create();
        $other = Device::factory()->online()->create();
        $device->forceFill(['admin_pin_hash' => Hash::make('012345')])->save();
        $other->forceFill(['admin_pin_hash' => Hash::make('987654')])->save();
        $endpoint = '/api/v1/device/admin/verify-pin';
        $this->postJson($endpoint, ['pin' => '012345'])->assertUnauthorized();
        $this->withToken($other->issueToken())->postJson($endpoint, ['pin' => '012345', 'device_id' => $device->id])->assertForbidden();
        $this->withToken($device->issueToken())->postJson($endpoint, ['pin' => '111111'])->assertForbidden();
        $this->postJson($endpoint, ['pin' => ''])->assertUnprocessable();
        $this->postJson($endpoint, ['pin' => '012345'])->assertOk()->assertExactJson(['authorized' => true]);
        $device->forceFill(['status' => DeviceStatus::Disabled])->save();
        $this->postJson($endpoint, ['pin' => '012345'])->assertForbidden();
        $device->revokeToken();
        $this->postJson($endpoint, ['pin' => '012345'])->assertUnauthorized();
    }

    public function test_no_pin_is_accepted_until_an_admin_configures_one(): void
    {
        $device = Device::factory()->online()->create();
        $this->withToken($device->issueToken())->postJson('/api/v1/device/admin/verify-pin', ['pin' => '123456'])->assertStatus(409);
        $this->assertNull($device->fresh()->admin_pin_hash);
    }

    public function test_failed_attempts_are_limited_per_device_and_successes_are_not_counted(): void
    {
        $device = Device::factory()->online()->create();
        $device->forceFill(['admin_pin_hash' => Hash::make('012345')])->save();
        $this->withToken($device->issueToken());
        $endpoint = '/api/v1/device/admin/verify-pin';
        for ($i = 0; $i < 6; $i++) {
            $this->postJson($endpoint, ['pin' => '012345'])->assertOk();
        }
        for ($i = 0; $i < 5; $i++) {
            $this->postJson($endpoint, ['pin' => '111111'])->assertForbidden();
        }
        $this->postJson($endpoint, ['pin' => '012345'])->assertStatus(429);
        $this->travel(301)->seconds();
        $this->postJson($endpoint, ['pin' => '012345'])->assertOk();

    }
}
