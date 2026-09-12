<?php

namespace App\Http\Controllers\Api\Device;

use App\Domain\Devices\Enums\DeviceCommandStatus;
use App\Domain\Devices\Enums\DeviceCommandType;
use App\Domain\Devices\Events\DeviceCommandCompleted;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceCommand;
use App\Domain\QuickPlay\Actions\UpdateQuickPlayDeviceStatus;
use App\Domain\QuickPlay\Enums\QuickPlayDeviceStatus;
use App\Domain\QuickPlay\Models\QuickPlayDevice;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommandController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var Device $device */
        $device = $request->user();

        $commands = $device->commands()->deliverable()->oldest()->limit(20)->get();

        $payload = $commands->map(fn (DeviceCommand $command) => [
            'id' => $command->id,
            'command' => $command->command->value,
            'payload' => $command->payload,
            'expires_at' => $command->expires_at?->toIso8601String(),
        ])->all();

        $commands->each(fn (DeviceCommand $command) => $command->forceFill([
            'status' => DeviceCommandStatus::Sent,
            'sent_at' => now(),
        ])->save());

        return response()->json(['commands' => $payload]);
    }

    public function result(Request $request, DeviceCommand $command): JsonResponse
    {
        /** @var Device $device */
        $device = $request->user();

        if ($command->device_id !== $device->id) {
            return response()->json(['message' => 'Comando no encontrado.'], 404);
        }

        $data = $request->validate([
            'status' => ['required', 'in:completed,failed'],
            'result' => ['nullable', 'array'],
            'error' => ['nullable', 'string', 'max:500'],
        ]);

        $command->forceFill([
            'status' => $data['status'] === 'completed' ? DeviceCommandStatus::Completed : DeviceCommandStatus::Failed,
            'result' => $data['result'] ?? null,
            'error' => $data['error'] ?? null,
            'executed_at' => now(),
        ])->save();

        DeviceCommandCompleted::dispatch($command);

        // A quick play is delivered as a device command; forward the final
        // result to the quick play ledger so the dashboard reflects it.
        if ($command->command === DeviceCommandType::QuickPlay) {
            $row = QuickPlayDevice::query()->where('command_id', $command->id)->first();

            if ($row) {
                app(UpdateQuickPlayDeviceStatus::class)->handle(
                    $row,
                    $data['status'] === 'completed' ? QuickPlayDeviceStatus::Completed : QuickPlayDeviceStatus::Failed,
                    $data['error'] ?? null,
                );
            }
        }

        return response()->json(['ok' => true]);
    }
}
