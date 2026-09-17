<?php

use App\Http\Controllers\Api\Device\ActivationController;
use App\Http\Controllers\Api\Device\AdminPinController;
use App\Http\Controllers\Api\Device\CommandController;
use App\Http\Controllers\Api\Device\HeartbeatController;
use App\Http\Controllers\Api\Device\ManifestController;
use App\Http\Controllers\Api\Device\PlaybackEventController;
use App\Http\Controllers\Api\Device\QuickPlayController;
use App\Http\Controllers\Api\Device\SyncController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Device API v1 — public + authenticated device routes
|--------------------------------------------------------------------------
*/

// Public: activation handshake. Strictly rate limited.
Route::post('activation/request', [ActivationController::class, 'request'])
    ->middleware('throttle:device-activation')
    ->name('api.device.activation.request');

Route::post('activation/confirm', [ActivationController::class, 'confirm'])
    ->middleware('throttle:device-activation')
    ->name('api.device.activation.confirm');

// Authenticated device endpoints (bearer token issued at activation).
Route::middleware(['device.token', 'throttle:device-api'])->group(function () {
    Route::post('admin/verify-pin', [AdminPinController::class, 'verify'])
        ->name('api.device.admin.verify-pin');
    Route::post('heartbeat', [HeartbeatController::class, 'store'])->name('api.device.heartbeat');
    Route::get('manifest', [ManifestController::class, 'show'])->name('api.device.manifest');
    Route::get('sync', [SyncController::class, 'show'])->name('api.device.sync');
    Route::post('sync/acknowledge', [SyncController::class, 'acknowledge'])->name('api.device.sync.acknowledge');
    Route::post('playback-events/batch', [PlaybackEventController::class, 'store'])
        ->middleware('throttle:device-playback')
        ->name('api.device.playback.batch');
    Route::get('commands', [CommandController::class, 'index'])->name('api.device.commands.index');
    Route::post('commands/{command}/result', [CommandController::class, 'result'])
        ->name('api.device.commands.result');
    Route::post('quick-play/status', [QuickPlayController::class, 'status'])->name('api.device.quick-play.status');
});
