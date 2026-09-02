<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Auth\LoginController;

// Auth routes
Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// API routes (protected)
Route::prefix('api')->middleware('auth')->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/revenue-total', [DashboardController::class, 'revenueTotal']);
    Route::get('/dashboard/revenue-by-sales-type', [DashboardController::class, 'revenueBySalesType']);
    Route::get('/dashboard/revenue-los', [DashboardController::class, 'revenueLos']);
    Route::get('/dashboard/broadband-pack', [DashboardController::class, 'broadbandPack']);
    Route::get('/dashboard/prepaid-broadband', [DashboardController::class, 'prepaidBroadband']);
    Route::get('/dashboard/driver-trend', [DashboardController::class, 'driverTrend']);
    Route::get('/dashboard/gauge-chart', [DashboardController::class, 'getGaugeChartData']);
    Route::get('/dashboard/variance-analysis', [DashboardController::class, 'varianceAnalysis']);
    Route::get('/dashboard/revenue-by-area', [DashboardController::class, 'revenueByArea']);

    // Location Dimension API
    Route::get('/locations', [DashboardController::class, 'locations']);

    // Target Management API
    Route::get('/targets', [\App\Http\Controllers\Api\TargetController::class, 'index']);
    Route::post('/targets', [\App\Http\Controllers\Api\TargetController::class, 'store']);
    Route::post('/targets/bulk', [\App\Http\Controllers\Api\TargetController::class, 'bulkStore']);
    Route::delete('/targets', [\App\Http\Controllers\Api\TargetController::class, 'destroy']);

    // Cache Management
    Route::post('/cache/clear', function () {
        \Illuminate\Support\Facades\Cache::flush();
        return response()->json(['status' => 'ok', 'message' => 'Cache cleared']);
    });
});

// SPA catch-all (protected)
Route::middleware('auth')->get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
