<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class DeviceAdminPinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('device'));
    }

    public function rules(): array
    {
        return ['pin' => ['required', 'string', 'regex:/\A[0-9]{6}\z/', 'confirmed']];
    }
}
