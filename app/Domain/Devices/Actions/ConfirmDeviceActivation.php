<?php

namespace App\Domain\Devices\Actions;

use App\Domain\Devices\Enums\ActivationStatus;
use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Events\DeviceConnected;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceActivation;
use App\Domain\Media\Models\Layout;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ConfirmDeviceActivation
{
    /**
     * Exchange a claimed activation code for a device record and bearer token.
     *
     * @return array{device: Device, token: string}
     */
    public function handle(string $code, ?string $deviceUuid, ?string $appVersion, ?string $ip, ?string $name = null): array
    {
        return DB::transaction(function () use ($code, $deviceUuid, $appVersion, $ip, $name) {
            $activation = DeviceActivation::query()->where('code', $code)->lockForUpdate()->first();

            if (! $activation) {
                throw ValidationException::withMessages(['code' => 'Código de activación inválido.']);
            }

            if ($activation->status === ActivationStatus::Revoked) {
                throw ValidationException::withMessages(['code' => 'Este código fue revocado.']);
            }

            if ($activation->status === ActivationStatus::Expired || $activation->isExpired()) {
                throw ValidationException::withMessages(['code' => 'Este código expiró. Solicita uno nuevo.']);
            }

            if (! $activation->business_id) {
                throw ValidationException::withMessages(['code' => 'El administrador aún no ha asignado este código a un negocio.']);
            }

            if ($activation->device_id && $activation->device_uuid !== $deviceUuid) {
                throw ValidationException::withMessages(['code' => 'Este código ya fue reclamado por otro dispositivo.']);
            }

            $deviceUuid ??= $activation->device_uuid ?? (string) Str::uuid();

            $device = $activation->device ?? new Device(['uuid' => $deviceUuid]);

            $device->fill([
                'business_id' => $activation->business_id,
                'location_id' => $activation->location_id,
                'name' => $name ?: ($activation->device_name ?: 'Pantalla '.substr($deviceUuid, 0, 4)),
                'uuid' => $deviceUuid,
                'activation_code' => $activation->code,
                'app_version' => $appVersion,
                'status' => DeviceStatus::Online,
                'last_seen_at' => now(),
                'last_ip' => $ip,
                'current_layout_id' => $device->current_layout_id ?? Layout::query()->where('is_default', true)->value('id'),
            ])->save();

            $token = $device->issueToken();

            $activation->forceFill([
                'status' => ActivationStatus::Claimed,
                'device_id' => $device->id,
                'device_uuid' => $deviceUuid,
                'claimed_at' => now(),
            ])->save();

            DeviceConnected::dispatch($device);

            return ['device' => $device, 'token' => $token];
        });
    }
}
