<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\LiveEmbedController;
use Illuminate\Support\Facades\Route;

Route::get('live/embed/{media}', [LiveEmbedController::class, 'show'])->middleware('signed')->name('live.embed');
Route::get('live/preview', [LiveEmbedController::class, 'preview'])->middleware('signed')->name('live.preview');

Route::get('/', function () {
    $user = auth()->user();

    if ($user && $user->hasPermission('business.dashboard.view') && ! $user->hasPermission('devices.view')) {
        return redirect()->route('business.dashboard');
    }

    return redirect()->route('dashboard');
});

Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
});

Route::post('logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::middleware(['auth', 'staff'])
    ->prefix('admin')
    ->group(base_path('routes/admin.php'));

Route::middleware(['auth', 'business.context'])
    ->prefix('business')
    ->group(base_path('routes/business.php'));
