<?php

namespace App\Http\Requests\Api;

use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Http\FormRequest;

class DeviceHeartbeatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof Device;
    }

    public function rules(): array
    {
        return [
            'app_version' => ['nullable', 'string', 'max:40'],
            'available_storage' => ['nullable', 'integer', 'min:0'],
            'storage_total' => ['nullable', 'integer', 'min:0'],
            'manifest_version' => ['nullable', 'string', 'max:40'],
            'player_status' => ['nullable', 'string', 'max:40'],
            'network_status' => ['nullable', 'string', 'max:40'],
            'diagnostics' => ['nullable', 'array:sync_error,last_sync_at,business_images_expected,business_images_downloaded,business_images_bytes,media_directory'],
            'diagnostics.sync_error' => ['nullable', 'string', 'max:100', 'regex:/\A[A-Z0-9_]+\z/'],
            'diagnostics.last_sync_at' => ['nullable', 'integer', 'min:0'],
            'diagnostics.business_images_expected' => ['nullable', 'integer', 'between:0,1000000'],
            'diagnostics.business_images_downloaded' => ['nullable', 'integer', 'between:0,1000000'],
            'diagnostics.business_images_bytes' => ['nullable', 'integer', 'min:0'],
            'diagnostics.media_directory' => ['nullable', 'string', 'max:255'],
        ];
    }
}
