<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\DashboardService;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function summary(Request $request)
    {
        $year = $request->get('year', date('Y'));
        $month = $request->get('month', 'All');
        $quarter = $request->get('quarter', 'All');
        
        $cacheKey = "dashboard_summary_{$year}_{$month}_{$quarter}";

        $data = Cache::remember($cacheKey, 43200, function () use ($request) {
            return $this->dashboardService->summary($request);
        });

        return response()->json($data);
    }

    public function getGaugeChartData(Request $request)
    {
        return response()->json($this->dashboardService->getGaugeChartData($request));
    }

    public function revenueTotal(Request $request)
    {
        return response()->json($this->dashboardService->revenueTotal($request));
    }

    public function revenueBySalesType(Request $request)
    {
        return response()->json($this->dashboardService->revenueBySalesType($request));
    }

    public function revenueLos(Request $request)
    {
        return response()->json($this->dashboardService->revenueLos($request));
    }

    public function broadbandPack(Request $request)
    {
        return response()->json($this->dashboardService->broadbandPack($request));
    }

    public function prepaidBroadband(Request $request)
    {
        return response()->json($this->dashboardService->prepaidBroadband($request));
    }
    
    public function driverTrend(Request $request)
    {
        return response()->json($this->dashboardService->driverTrend($request));
    }

    public function varianceAnalysis(Request $request)
    {
        return response()->json($this->dashboardService->varianceAnalysis($request));
    }
}
