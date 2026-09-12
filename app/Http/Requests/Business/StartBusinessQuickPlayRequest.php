<?php

namespace App\Http\Requests\Business;

use App\Http\Requests\Admin\StartQuickPlayRequest;
use App\Support\BusinessAccess;
use Illuminate\Validation\Rule;

class StartBusinessQuickPlayRequest extends StartQuickPlayRequest
{
    public function authorize(): bool
    {
        return BusinessAccess::current() !== null
            && $this->user()->hasPermission('business.playlists.manage')
            && $this->user()->hasPermission('business.devices.view');
    }

    public function rules(): array
    {
        $business = BusinessAccess::current();

        return array_replace(parent::rules(), [
            'media_asset_id' => ['required', 'integer', Rule::exists('media_assets', 'id')
                ->where('owner_type', $business->getMorphClass())->where('owner_id', $business->id)->where('processing_status', 'ready')],
            'device_ids.*' => ['integer', 'distinct', Rule::exists('devices', 'id')->where('business_id', $business->id)],
            'business_ids.*' => ['integer', 'distinct', Rule::in([$business->id])],
            'location_ids.*' => ['integer', 'distinct', Rule::exists('locations', 'id')->where('business_id', $business->id)],
        ]);
    }
}
