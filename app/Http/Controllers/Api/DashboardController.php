<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\DashboardService;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function summary(Request $request)
    {
        return response()->json($this->dashboardService->summary($request));
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
