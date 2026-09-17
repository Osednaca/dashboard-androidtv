<?php

namespace App\Http\Controllers\Api\Device;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\VerifyDeviceAdminPinRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AdminPinController extends Controller
{
    public function verify(VerifyDeviceAdminPinRequest $request): JsonResponse
    {
        // Run after device authentication so failures are counted per TV, not per shared IP.
        $key = 'device-admin-pin:'.$request->user()->getKey();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json(['message' => 'Demasiados intentos. Espera cinco minutos.'], 429)
                ->header('Retry-After', (string) RateLimiter::availableIn($key));
        }

        $hash = $request->user()->admin_pin_hash;

        if ($hash === null) {
            return response()->json(['message' => 'Configura el PIN de esta pantalla en el dashboard.'], 409);
        }

        if (! Hash::check($request->validated('pin'), $hash)) {
            RateLimiter::hit($key, 300);

            return response()->json(['message' => 'PIN incorrecto.'], 403);
        }

        RateLimiter::clear($key);

        return response()->json(['authorized' => true]);
    }
}
