<?php

namespace App\Http\Middleware;

use App\Domain\Businesses\Models\Business;
use App\Domain\Devices\Models\Device;
use App\Domain\Operations\Models\Alert;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'app' => [
                'name' => config('app.name', 'Signage TV'),
                'env' => config('app.env'),
                'version' => config('signage.version', '1.0.0'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                    'job_title' => $user->job_title,
                    'status' => $user->status?->value,
                    'roles' => $user->roleNames(),
                    'permissions' => $user->permissionNames(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'notifications' => fn () => $user ? $this->notifications($request) : null,
            'business' => fn () => $request->attributes->get('business_context'),
        ];
    }

    /**
     * Business users only see alerts for their own screens; administrators see
     * the network-wide alert feed.
     *
     * @return array{unread: int, recent: array<int, array<string, mixed>>}
     */
    protected function notifications(Request $request): array
    {
        $business = $request->attributes->get('current_business');

        $query = Alert::query()->where('status', 'open');

        if ($business instanceof Business) {
            $deviceIds = $business->devices()->pluck('id');

            $query->where('alertable_type', (new Device)->getMorphClass())
                ->whereIn('alertable_id', $deviceIds);
        }

        $unread = (clone $query)->count();

        $recent = $query
            ->latest('triggered_at')
            ->limit(5)
            ->get()
            ->map(fn (Alert $alert) => [
                'id' => $alert->id,
                'severity' => $alert->severity,
                'title' => $alert->title,
                'message' => $alert->message,
                'triggered_at' => $alert->triggered_at?->toIso8601String(),
            ])
            ->all();

        return ['unread' => $unread, 'recent' => $recent];
    }
}
