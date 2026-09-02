<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DashboardDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Uses SIMPLIFIED FLAT TARGET ALLOCATION:
     * - Annual Target: Rp 120 Billion / year
     * - Monthly Target: Rp 10 Billion / month
     * - Product category splits (50% Broadband, 20% Digital, 15% Voice, 5% SMS, 5% IR, 5% Others)
     * - Sales type split (80% BAU, 20% New Sales)
     * - Daily Actual revolves around (Monthly Target / Days in Month) with ±3% variance
     */
    public function run(): void
    {
        // 1. Create default admin user
        User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@dashboard.com')],
            [
                'name' => env('ADMIN_NAME', 'Admin Dashboard'),
                'password' => Hash::make(env('ADMIN_PASSWORD', 'admin123')),
            ]
        );

        $this->command->info('Populating dimensions...');

        // 2. Setup Dimensions
        $salesTypes = ['BAU', 'New Sales'];
        $salesTypeIds = [];
        foreach ($salesTypes as $type) {
            $salesTypeIds[$type] = DB::table('dim_sales_types')->insertGetId(['type_name' => $type]);
        }

        $categories = ['Broadband', 'Digital', 'Voice', 'SMS', 'IR', 'Others'];
        $broadbandPacks = ['Acquisition', 'Core', 'CVM(BTL)', 'Physical Voucher', 'Others'];
        $productIds = [];
        foreach ($categories as $cat) {
            if ($cat === 'Broadband') {
                foreach ($broadbandPacks as $pack) {
                    $productIds["$cat-$pack"] = DB::table('dim_products')->insertGetId([
                        'category' => $cat,
                        'broadband_pack_type' => $pack
                    ]);
                }
            } else {
                $productIds["$cat-"] = DB::table('dim_products')->insertGetId([
                    'category' => $cat,
                    'broadband_pack_type' => null
                ]);
            }
        }

        // 2b. Setup Locations (Area & Region)
        $this->command->info('Populating locations (Area & Region)...');
        $locationMap = [
            'Area 1 Sumatera' => [
                'Region Sumbagut',
                'Region Sumbagteng',
                'Region Sumbagsel',
            ],
            'Area 2 Jabotabek' => [
                'Region Jabotabek',
                'Region Jawa Barat',
            ],
            'Area 3 Jawa Bali' => [
                'Region Jawa Tengah & DIY',
                'Region Jawa Timur',
                'Region Balinusra',
            ],
            'Area 4 Pamasuka' => [
                'Region Kalimantan',
                'Region Sulawesi',
                'Region Maluku dan Papua',
            ],
        ];

        $locationIds = [];
        $now = Carbon::now();
        foreach ($locationMap as $areaName => $regions) {
            foreach ($regions as $regionName) {
                $locationIds[] = DB::table('dim_locations')->insertGetId([
                    'area_name'   => $areaName,
                    'region_name' => $regionName,
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ]);
            }
        }

        // Revenue distribution weights per location (index matches $locationIds order)
        // Jabotabek & Jawa are weighted heavier (realistic Indonesia telco distribution)
        $locationWeights = [
            0.07, // Sumbagut
            0.06, // Sumbagteng
            0.05, // Sumbagsel
            0.25, // Jabotabek (largest)
            0.15, // Jawa Barat
            0.12, // Jateng & DIY
            0.13, // Jawa Timur
            0.05, // Balinusra
            0.05, // Kalimantan
            0.04, // Sulawesi
            0.03, // Maluku dan Papua
        ];

        $driverMetrics = ['Playing User', 'Payload User', 'Payload All', 'Trx New Sales', 'Sell Out'];
        $metricIds = [];
        foreach ($driverMetrics as $metric) {
            $metricIds[$metric] = DB::table('dim_metrics')->insertGetId(['metric_name' => $metric]);
        }

        // 3. Simplified Target Allocation Logic
        // Total Target per Month = 10 Billion IDR (10,000,000,000 IDR) -> 120 Billion IDR / Year
        $monthlyTotalTarget = 10000000000.00;

        // Category Shares (Total = 1.00 / 100%)
        $categoryShares = [
            'Broadband' => 0.50, // 5 Billion IDR / month
            'Digital'   => 0.20, // 2 Billion IDR / month
            'Voice'     => 0.15, // 1.5 Billion IDR / month
            'SMS'       => 0.05, // 500 Million IDR / month
            'IR'        => 0.05, // 500 Million IDR / month
            'Others'    => 0.05, // 500 Million IDR / month
        ];

        // Broadband Pack Shares within Broadband 50%
        $packShares = [
            'Core'             => 0.40, // 2.0 Bn
            'Acquisition'      => 0.25, // 1.25 Bn
            'CVM(BTL)'         => 0.20, // 1.0 Bn
            'Physical Voucher' => 0.10, // 0.5 Bn
            'Others'           => 0.05, // 0.25 Bn
        ];

        // Sales Type Shares (80% BAU / Existing, 20% New Sales)
        $salesTypeShares = [
            'BAU'       => 0.80,
            'New Sales' => 0.20,
        ];

        $this->command->info('Generating flat targets (10 Billion IDR/month = 120 Billion IDR/year)...');
        $factTargets = [];
        $monthlyTargetMap = [];
        $now = Carbon::now();

        $years = [2024, 2025];
        foreach ($years as $year) {
            for ($month = 1; $month <= 12; $month++) {
                
                // 1. Insert clean Monthly Targets for the gauge CRUD
                foreach ($salesTypes as $salesType) {
                    $sTypeId = $salesTypeIds[$salesType];
                    $stShare = $salesTypeShares[$salesType];
                    
                    $factTargets[] = [
                        'year' => $year,
                        'month' => $month,
                        'dim_sales_type_id' => $sTypeId,
                        'dim_product_id' => null, // Monthly target applies globally
                        'target_revenue' => round($monthlyTotalTarget * $stShare, 2),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                // 2. Generate monthlyTargetMap for simulating daily ACTUAL revenues breakdown
                foreach ($categories as $category) {
                    $catMonthlyTarget = $monthlyTotalTarget * $categoryShares[$category];

                    foreach ($salesTypes as $salesType) {
                        $sTypeId = $salesTypeIds[$salesType];
                        $stShare = $salesTypeShares[$salesType];

                        if ($category === 'Broadband') {
                            foreach ($broadbandPacks as $pack) {
                                $pId = $productIds["$category-$pack"];
                                $packShare = $packShares[$pack];
                                $targetAmount = round($catMonthlyTarget * $packShare * $stShare, 2);
                                $monthlyTargetMap["{$year}-{$month}-{$pId}-{$sTypeId}"] = $targetAmount;
                            }
                        } else {
                            $pId = $productIds["$category-"];
                            $targetAmount = round($catMonthlyTarget * $stShare, 2);
                            $monthlyTargetMap["{$year}-{$month}-{$pId}-{$sTypeId}"] = $targetAmount;
                        }
                    }
                }
            }
        }

        DB::table('fact_targets')->insert($factTargets);

        // 4. Generate Daily Actual Revenues into `fact_revenues`
        $this->command->info('Generating daily actual revenues revolving around (monthly_target / days_in_month)...');
        $startDate = Carbon::create(2024, 1, 1);
        $endDate = Carbon::create(2025, 12, 31);
        $factRevenues = [];
        $factDrivers = [];

        $baseDrivers = [
            'Playing User' => 1650000.00,
            'Payload User' => 720000.00,
            'Payload All' => 4800000.00,
            'Trx New Sales' => 95000.00,
            'Sell Out' => 340000.00,
        ];

        for ($date = clone $startDate; $date->lte($endDate); $date->addDay()) {
            $year = $date->year;
            $month = $date->month;
            $daysInMonth = $date->daysInMonth;

            $dimDateId = DB::table('dim_dates')->insertGetId([
                'date' => $date->format('Y-m-d'),
                'year' => $year,
                'month' => $month,
                'quarter' => ceil($month / 3),
                'day_of_week' => $date->dayOfWeekIso
            ]);

            $dowFactor = [1 => 1.01, 2 => 0.99, 3 => 1.02, 4 => 1.00, 5 => 1.04, 6 => 0.98, 7 => 0.96][$date->dayOfWeekIso];
            $noise = function () {
                return 0.97 + (mt_rand(0, 60) / 1000);
            };

            foreach ($categories as $category) {
                foreach ($salesTypes as $salesType) {
                    $sTypeId = $salesTypeIds[$salesType];

                    if ($category === 'Broadband') {
                        foreach ($broadbandPacks as $pack) {
                            $pId = $productIds["$category-$pack"];
                            $monthlyTarget = $monthlyTargetMap["{$year}-{$month}-{$pId}-{$sTypeId}"];

                            $dailyBase = $monthlyTarget / $daysInMonth;

                            // Split revenue across all 11 locations using weights
                            foreach ($locationIds as $locIdx => $locId) {
                                $locShare = $locationWeights[$locIdx];
                                $actualAmount = round($dailyBase * $locShare * $dowFactor * $noise(), 2);

                                $factRevenues[] = [
                                    'dim_date_id' => $dimDateId,
                                    'dim_product_id' => $pId,
                                    'dim_sales_type_id' => $sTypeId,
                                    'dim_location_id' => $locId,
                                    'actual_revenue' => $actualAmount,
                                ];
                            }
                        }
                    } else {
                        $pId = $productIds["$category-"];
                        $monthlyTarget = $monthlyTargetMap["{$year}-{$month}-{$pId}-{$sTypeId}"];

                        $dailyBase = $monthlyTarget / $daysInMonth;

                        // Split revenue across all 11 locations using weights
                        foreach ($locationIds as $locIdx => $locId) {
                            $locShare = $locationWeights[$locIdx];
                            $actualAmount = round($dailyBase * $locShare * $dowFactor * $noise(), 2);

                            $factRevenues[] = [
                                'dim_date_id' => $dimDateId,
                                'dim_product_id' => $pId,
                                'dim_sales_type_id' => $sTypeId,
                                'dim_location_id' => $locId,
                                'actual_revenue' => $actualAmount,
                            ];
                        }
                    }
                }
            }

            foreach ($driverMetrics as $metric) {
                $base = $baseDrivers[$metric];
                $factDrivers[] = [
                    'dim_date_id' => $dimDateId,
                    'dim_metric_id' => $metricIds[$metric],
                    'value' => round($base * $dowFactor * $noise(), 2),
                ];
            }

            if (count($factRevenues) >= 500) {
                DB::table('fact_revenues')->insert($factRevenues);
                $factRevenues = [];
            }
            if (count($factDrivers) >= 500) {
                DB::table('fact_drivers')->insert($factDrivers);
                $factDrivers = [];
            }
        }

        if (!empty($factRevenues)) DB::table('fact_revenues')->insert($factRevenues);
        if (!empty($factDrivers)) DB::table('fact_drivers')->insert($factDrivers);

        $this->command->info('Flat target & revenue seeding completed successfully!');
    }
}
