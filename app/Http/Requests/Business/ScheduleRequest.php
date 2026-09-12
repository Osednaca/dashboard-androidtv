<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermission('business.schedules.manage');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'playlist_id' => ['required', 'integer', 'exists:playlists,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'daily_start_time' => ['nullable', 'date_format:H:i'],
            'daily_end_time' => ['nullable', 'date_format:H:i', 'after:daily_start_time'],
            'days_of_week' => ['nullable', 'array'],
            'days_of_week.*' => ['integer', 'between:1,7'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'priority' => ['nullable', 'integer', 'between:0,100'],
        ];
    }
}
