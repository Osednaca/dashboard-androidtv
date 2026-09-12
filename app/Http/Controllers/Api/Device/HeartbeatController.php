<?php

namespace App\Http\Controllers\Api\Device;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceHeartbeat;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HeartbeatController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'app_version' => ['nullable', 'string', 'max:40'],
            'available_storage' => ['nullable', 'integer', 'min:0'],
            'storage_total' => ['nullable', 'integer', 'min:0'],
            'manifest_version' => ['nullable', 'string', 'max:40'],
            'player_status' => ['nullable', 'string', 'max:40'],
            'network_status' => ['nullable', 'string', 'max:40'],
        ]);

        /** @var Device $device */
        $device = $request->user();

        DeviceHeartbeat::query()->create([
            'device_id' => $device->id,
            'recorded_at' => now(),
            'app_version' => $data['app_version'] ?? $device->app_version,
            'available_storage' => $data['available_storage'] ?? $device->storage_free,
            'manifest_version' => $data['manifest_version'] ?? $device->current_manifest_version,
            'player_status' => $data['player_status'] ?? null,
            'network_status' => $data['network_status'] ?? null,
            'created_at' => now(),
        ]);

        $device->forceFill([
            'last_seen_at' => now(),
            'status' => DeviceStatus::Online,
            'app_version' => $data['app_version'] ?? $device->app_version,
            'storage_free' => $data['available_storage'] ?? $device->storage_free,
            'storage_total' => $data['storage_total'] ?? $device->storage_total,
        ])->save();

        return response()->json([
            'ok' => true,
            'server_time' => now()->toIso8601String(),
            'pending_manifest_version' => $device->pending_manifest_version,
            'commands_pending' => $device->commands()->deliverable()->count(),
        ]);
    }
}
