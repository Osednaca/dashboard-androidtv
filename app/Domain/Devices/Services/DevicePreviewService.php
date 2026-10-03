<?php

namespace App\Domain\Devices\Services;

use App\Domain\Devices\Models\Device;
use App\Http\Presenters\EntityPresenter;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

/** Read the snapshot acknowledged by this TV; never rebuild on a preview GET. */
class DevicePreviewService
{
    public function forDevice(Device $device): array
    {
        $device->loadMissing(['business', 'location', 'currentLayout', 'currentPlaylist']);
        $manifest = $device->current_manifest_version === null ? null
            : $device->manifests()->where('version', $device->current_manifest_version)->first();
        $payload = $manifest?->payload ?? [];
        $at = now(data_get($payload, 'device.timezone', config('app.timezone')));
        $assets = collect($payload['assets'] ?? [])->keyBy('id');
        $playlist = $payload['business_playlist'] ?? null;
        foreach (collect($payload['schedules'] ?? [])->sortByDesc('priority') as $schedule) {
            if ($this->matches($schedule, $at)) {
                $scheduled = collect($payload['scheduled_playlists'] ?? [])->firstWhere('id', $schedule['playlist_id']);
                if ($scheduled) {
                    $playlist = $scheduled;
                    break;
                }
            }
        }
        $item = collect($playlist['items'] ?? [])->sortBy('order')->first(
            fn ($item) => $assets->has($item['media_asset_id'] ?? null)
        );
        $advertising = null;
        foreach ($payload['advertising_playlist']['campaigns'] ?? [] as $campaign) {
            if (! $this->matches($campaign, $at)) {
                continue;
            }
            $creative = collect($campaign['creatives'] ?? [])->first(
                fn ($creative) => $assets->has($creative['media_asset_id'] ?? null)
                    && $this->liveIsEligible($creative, $assets->get($creative['media_asset_id']), $at)
            );
            if ($creative) {
                $advertising = ['campaign_name' => $campaign['name'], 'media' => $assets->get($creative['media_asset_id'])];
                break;
            }
        }

        return [
            'device' => EntityPresenter::device($device),
            'layout' => $this->layout($payload['layout'] ?? null),
            'business_media' => $item ? $assets->get($item['media_asset_id']) : null,
            'advertising' => $advertising,
            'playlist' => $playlist ? ['id' => $playlist['id'], 'name' => $playlist['name']] : null,
            'last_sync_at' => $device->last_sync_at?->toIso8601String(),
            'manifest_version' => $manifest?->version,
            'pending_manifest_version' => $device->pending_manifest_version,
            'status' => $manifest ? 'approximate' : 'unconfirmed',
            'playback_reported' => false,
            'checked_at' => now()->toIso8601String(),
        ];
    }

    private function layout(?array $layout): ?array
    {
        if (! $layout) {
            return null;
        }
        $configuration = $layout['configuration'] ?? [];
        $area = strtolower($configuration['business_area'] ?? 'left');
        $rotation = $configuration['rotation'] ?? (in_array($layout['orientation'] ?? '', ['portrait', 'vertical']) ? 90 : 0);
        $split = strtolower($configuration['split'] ?? (in_array($area, ['top', 'bottom']) ? 'top_bottom' : 'side_by_side'));

        return $layout + [
            'ratio' => $layout['business_percentage'].'/'.$layout['advertising_percentage'],
            'rotation' => (int) $rotation,
            'split' => in_array($split, ['top_bottom', 'vertical']) ? 'top_bottom' : 'side_by_side',
            'business_first' => ! in_array($area, ['right', 'bottom']),
        ];
    }

    private function matches(array $window, CarbonInterface $at): bool
    {
        $date = $at->toDateString();
        if (($window['starts_on'] ?? null) && $date < $window['starts_on']) {
            return false;
        }
        if (($window['ends_on'] ?? null) && $date > $window['ends_on']) {
            return false;
        }
        $days = $window['days_of_week'] ?? [];
        if ($days && ! in_array($at->dayOfWeekIso, $days, true)) {
            return false;
        }
        $start = $window['daily_start_time'] ?? null;
        $end = $window['daily_end_time'] ?? null;
        if (! $start || ! $end) {
            return true;
        }
        $time = $at->format('H:i:s');
        $start = strlen($start) === 5 ? $start.':00' : $start;
        $end = strlen($end) === 5 ? $end.':00' : $end;

        return $start <= $end ? $time >= $start && $time <= $end : $time >= $start || $time <= $end;
    }

    private function liveIsEligible(array $creative, array $asset, CarbonInterface $at): bool
    {
        if (($asset['type'] ?? null) !== 'live_stream') {
            return true;
        }
        $configuration = $creative['live_configuration'] ?? [];
        foreach (['starts_at' => true, 'ends_at' => false] as $key => $start) {
            if (! empty($configuration[$key])) {
                $boundary = Carbon::parse($configuration[$key]);
                if ($start ? $at->lt($boundary) : $at->gte($boundary)) {
                    return false;
                }
            }
        }

        return true;
    }
}
