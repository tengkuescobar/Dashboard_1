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
});

// SPA catch-all (protected)
Route::middleware('auth')->get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
