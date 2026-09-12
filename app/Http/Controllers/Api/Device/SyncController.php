<?php

namespace App\Http\Controllers\Api\Device;

use App\Domain\Devices\Events\DeviceSyncCompleted;
use App\Domain\Devices\Events\DeviceSyncFailed;
use App\Domain\Devices\Models\Device;
use App\Domain\Operations\Actions\RaiseAlert;
use App\Domain\Operations\Enums\AlertSeverity;
use App\Domain\Operations\Enums\AlertType;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SyncController extends Controller
{
    /**
     * Lightweight poll for configuration changes when the device is online.
     */
    public function show(Request $request): JsonResponse
    {
        /** @var Device $device */
        $device = $request->user();

        return response()->json([
            'server_time' => now()->toIso8601String(),
            'current_manifest_version' => $device->current_manifest_version,
            'pending_manifest_version' => $device->pending_manifest_version,
            'update_available' => $device->pending_manifest_version !== null,
            'layout_id' => $device->current_layout_id,
            'commands_pending' => $device->commands()->deliverable()->count(),
            'heartbeat_interval_seconds' => 60,
        ]);
    }

    /**
     * Device confirms it downloaded and activated a manifest version. Only then
     * does the previous manifest stop being used, so a failed download can never
     * break the live signage experience.
     */
    public function acknowledge(Request $request): JsonResponse
    {
        $data = $request->validate([
            'version' => ['required', 'string', 'max:40'],
            'success' => ['required', 'boolean'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        /** @var Device $device */
        $device = $request->user();

        $manifest = $device->manifests()->where('version', $data['version'])->first();

        if (! $manifest) {
            return response()->json(['message' => 'Versión de manifiesto desconocida.'], 404);
        }

        if (! $data['success']) {
            $manifest->forceFill(['status' => 'failed'])->save();
            $device->forceFill(['pending_manifest_version' => null])->save();

            DeviceSyncFailed::dispatch($device, $data['reason'] ?? 'Error de descarga');

            app(RaiseAlert::class)->handle(
                AlertType::SynchronizationFailed,
                'Sincronización fallida',
                "La pantalla «{$device->name}» no pudo activar el manifiesto {$data['version']}.",
                AlertSeverity::Warning,
                $device,
            );

            return response()->json(['ok' => false]);
        }

        DB::transaction(function () use ($device, $manifest, $data) {
            $device->manifests()
                ->where('status', 'current')
                ->update(['status' => 'superseded']);

            $manifest->forceFill([
                'status' => 'current',
                'activated_at' => now(),
            ])->save();

            $device->forceFill([
                'current_manifest_version' => $data['version'],
                'pending_manifest_version' => null,
                'last_sync_at' => now(),
            ])->save();
        });

        DeviceSyncCompleted::dispatch($device, $data['version']);

        app(RaiseAlert::class)
            ->resolve(AlertType::SynchronizationFailed, $device);

        return response()->json(['ok' => true]);
    }
}
