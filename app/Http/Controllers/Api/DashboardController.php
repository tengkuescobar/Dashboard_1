<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\DashboardService;
use App\Models\DimLocation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    protected $dashboardService;

    // Cache duration: 12 hours (in seconds)
    private const CACHE_TTL = 43200;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Build a unique cache key from the request parameters.
     */
    private function cacheKey(string $prefix, Request $request, array $extraKeys = []): string
    {
        $parts = [$prefix];
        foreach (array_merge(['year', 'month', 'quarter', 'grain', 'area', 'region'], $extraKeys) as $key) {
            $parts[] = $request->get($key, 'All');
        }
        return implode('_', $parts);
    }

    /**
     * Return the list of areas and regions for filter dropdowns.
     */
    public function locations()
    {
        $locations = DB::table('dim_locations')
            ->select('id', 'area_name', 'region_name')
            ->orderBy('area_name')
            ->orderBy('region_name')
            ->get();

        // Group by area for the frontend
        $grouped = $locations->groupBy('area_name')->map(function ($regions, $areaName) {
            return [
                'area' => $areaName,
                'regions' => $regions->map(fn($r) => [
                    'id' => $r->id,
                    'name' => $r->region_name,
                ])->values(),
            ];
        })->values();

        return response()->json($grouped);
    }

    public function summary(Request $request)
    {
        $key = $this->cacheKey('dashboard_summary', $request);

        $data = Cache::remember($key, self::CACHE_TTL, function () use ($request) {
            return $this->dashboardService->summary($request);
        });

        return response()->json($data);
    }

    public function getGaugeChartData(Request $request)
    {
        $key = $this->cacheKey('gauge_chart', $request, ['sales_type']);

        $data = Cache::remember($key, self::CACHE_TTL, function () use ($request) {
            return $this->dashboardService->getGaugeChartData($request);
        });

        return response()->json($data);
    }

    public function revenueTotal(Request $request)
    {
        $key = $this->cacheKey('revenue_total', $request);

        $data = Cache::remember($key, self::CACHE_TTL, function () use ($request) {
            return $this->dashboardService->revenueTotal($request);
        });

        return response()->json($data);
    }

    public function revenueBySalesType(Request $request)
    {
        $key = $this->cacheKey('revenue_sales_type', $request);

        $data = Cache::remember($key, self::CACHE_TTL, function () use ($request) {
            return $this->dashboardService->revenueBySalesType($request);
        });

        return response()->json($data);
    }

    public function revenueLos(Request $request)
    {
        $key = $this->cacheKey('revenue_los', $request);

        $data = Cache::remember($key, self::CACHE_TTL, function () use ($request) {
            return $this->dashboardService->revenueLos($request);
        });

        return response()->json($data);
    }

    public function broadbandPack(Request $request)
    {
        $key = $this->cacheKey('broadband_pack', $request);

        $data = Cache::remember($key, self::CACHE_TTL, function () use ($request) {
            return $this->dashboardService->broadbandPack($request);
        });

        return response()->json($data);
    }

    public function prepaidBroadband(Request $request)
    {
        $key = $this->cacheKey('prepaid_broadband', $request);

        $data = Cache::remember($key, self::CACHE_TTL, function () use ($request) {
            return $this->dashboardService->prepaidBroadband($request);
        });

        return response()->json($data);
    }
    
    public function driverTrend(Request $request)
    {
        $key = $this->cacheKey('driver_trend', $request, ['metric']);

        $data = Cache::remember($key, self::CACHE_TTL, function () use ($request) {
            return $this->dashboardService->driverTrend($request);
        });

        return response()->json($data);
    }

    public function varianceAnalysis(Request $request)
    {
        $key = $this->cacheKey('variance_analysis', $request);

        $data = Cache::remember($key, self::CACHE_TTL, function () use ($request) {
            return $this->dashboardService->varianceAnalysis($request);
        });

        return response()->json($data);
    }
}
