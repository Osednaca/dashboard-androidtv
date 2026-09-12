<?php

namespace App\Http\Controllers\Admin;

use App\Domain\Analytics\Services\DashboardService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(protected DashboardService $dashboard) {}

    public function index(Request $request): Response
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $to = $request->date('to') ?? today();
        $from = $request->date('from') ?? today()->subDays(29);

        return Inertia::render('Admin/Dashboard', [
            'overview' => $this->dashboard->overview(Carbon::parse($from), Carbon::parse($to)),
        ]);
    }
}
