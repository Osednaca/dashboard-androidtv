<?php

namespace App\Domain\Devices\Actions;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class VerifyDeviceAdminPin
{
    public function handle(Device $device, string $pin): void
    {
        abort_if($device->status === DeviceStatus::Disabled, 403);
        $key = 'device-admin-pin:'.$device->getKey();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw new HttpResponseException(response()->json(['message' => 'Demasiados intentos. Espera cinco minutos.'], 429)
                ->header('Retry-After', (string) RateLimiter::availableIn($key)));
        }
        if ($device->admin_pin_hash === null) {
            throw new HttpResponseException(response()->json(['message' => 'Configura el PIN de esta pantalla en el dashboard.'], 409));
        }
        if (! Hash::check($pin, $device->admin_pin_hash)) {
            RateLimiter::hit($key, 300);
            throw new HttpResponseException(response()->json(['message' => 'PIN incorrecto.'], 403));
        }
        RateLimiter::clear($key);
    }
}
