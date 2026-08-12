<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    private function getDateRange($year, $month, $type)
    {
        $currentCarbon = Carbon::create($year, $month, 1)->endOfMonth();
        $latestDateInDb = DB::table('dim_dates')->max('date');
        $currentDate = $currentCarbon->format('Y-m-d') > $latestDateInDb ? $latestDateInDb : $currentCarbon->format('Y-m-d');
        
        switch ($type) {
            case 'current_month':
                return [Carbon::create($year, $month, 1)->format('Y-m-d'), $currentDate];
            case 'prev_month':
                $prev = Carbon::create($year, $month, 1)->subMonth();
                $prevEnd = $prev->copy()->endOfMonth()->format('Y-m-d') > $latestDateInDb ? $latestDateInDb : $prev->copy()->endOfMonth()->format('Y-m-d');
                $day = Carbon::parse($currentDate)->day;
                $prevCompare = $prev->copy()->setDay(min($day, $prev->daysInMonth))->format('Y-m-d');
                return [$prev->format('Y-m-d'), $prevCompare];
            case 'prev_year_month':
                $prevYear = Carbon::create($year - 1, $month, 1);
                $day = Carbon::parse($currentDate)->day;
                $prevCompare = $prevYear->copy()->setDay(min($day, $prevYear->daysInMonth))->format('Y-m-d');
                return [$prevYear->format('Y-m-d'), $prevCompare];
            case 'ytd':
                return [Carbon::create($year, 1, 1)->format('Y-m-d'), $currentDate];
            case 'prev_ytd':
                $day = Carbon::parse($currentDate)->day;
                $prevCompare = Carbon::create($year - 1, $month, min($day, Carbon::create($year - 1, $month, 1)->daysInMonth))->format('Y-m-d');
                return [Carbon::create($year - 1, 1, 1)->format('Y-m-d'), $prevCompare];
        }
    }

    public function summary(Request $request)
    {
        $year = $request->get('year', 2025);
        $month = $request->get('month', 12);

        $cmRange = $this->getDateRange($year, $month, 'current_month');
        $pmRange = $this->getDateRange($year, $month, 'prev_month');
        $pymRange = $this->getDateRange($year, $month, 'prev_year_month');
        $ytdRange = $this->getDateRange($year, $month, 'ytd');
        $pytdRange = $this->getDateRange($year, $month, 'prev_ytd');

        // Revenue query helper using fact_revenues (Actual) and fact_targets (Target)
        $getRev = function($range, $salesType = null, $category = null, $packType = null) {
            $startDate = $range[0];
            $endDate = $range[1];

            // 1. Query Actual Revenue from fact_revenues
            $qActual = DB::table('fact_revenues')
                ->join('dim_dates', 'fact_revenues.dim_date_id', '=', 'dim_dates.id')
                ->join('dim_products', 'fact_revenues.dim_product_id', '=', 'dim_products.id')
                ->join('dim_sales_types', 'fact_revenues.dim_sales_type_id', '=', 'dim_sales_types.id')
                ->whereBetween('dim_dates.date', [$startDate, $endDate]);
            
            if ($salesType) $qActual->where('dim_sales_types.type_name', $salesType);
            if ($category) $qActual->where('dim_products.category', $category);
            if ($packType) $qActual->where('dim_products.broadband_pack_type', $packType);
            
            $actual = (float) $qActual->sum('actual_revenue');

            // 2. Query Target Revenue from fact_targets
            $startCarbon = Carbon::parse($startDate);
            $endCarbon = Carbon::parse($endDate);

            $qTarget = DB::table('fact_targets')
                ->join('dim_products', 'fact_targets.dim_product_id', '=', 'dim_products.id')
                ->join('dim_sales_types', 'fact_targets.dim_sales_type_id', '=', 'dim_sales_types.id')
                ->where('fact_targets.year', $startCarbon->year)
                ->where('fact_targets.month', $startCarbon->month);

            if ($salesType) $qTarget->where('dim_sales_types.type_name', $salesType);
            if ($category) $qTarget->where('dim_products.category', $category);
            if ($packType) $qTarget->where('dim_products.broadband_pack_type', $packType);

            $monthlyTarget = (float) $qTarget->sum('target_revenue');

            // Proportionate target for MTD
            $daysInMonth = $startCarbon->daysInMonth;
            $daysPassed = $endCarbon->day;
            $ratio = $daysInMonth > 0 ? ($daysPassed / $daysInMonth) : 1;
            $target = $monthlyTarget * $ratio;

            return (object)[
                'actual' => $actual,
                'target' => $target
            ];
        };

        $totalCM = $getRev($cmRange);
        $existingCM = $getRev($cmRange, 'BAU');
        $newSalesCM = $getRev($cmRange, 'New Sales');
        
        $totalPM = $getRev($pmRange);
        $totalPYM = $getRev($pymRange);
        $totalYTD = $getRev($ytdRange);

        $existingPM = $getRev($pmRange, 'BAU');
        $existingPYM = $getRev($pymRange, 'BAU');
        $existingYTD = $getRev($ytdRange, 'BAU');
        
        $newSalesPM = $getRev($pmRange, 'New Sales');
        $newSalesPYM = $getRev($pymRange, 'New Sales');
        $newSalesYTD = $getRev($ytdRange, 'New Sales');
        
        $bbCM = $getRev($cmRange, null, 'Broadband');
        $bbPM = $getRev($pmRange, null, 'Broadband');
        $bbPYM = $getRev($pymRange, null, 'Broadband');
        $bbYTD = $getRev($ytdRange, null, 'Broadband');

        $calcPct = function($val, $prev) {
            return $prev > 0 ? round((($val - $prev) / $prev) * 100, 1) : 0;
        };

        $mom = $calcPct($totalCM->actual, $totalPM->actual);
        $yoy = $calcPct($totalCM->actual, $totalPYM->actual);

        $categories = ['Broadband', 'Digital', 'IR', 'Voice', 'SMS', 'Others'];
        $breakdown = [];
        foreach ($categories as $cat) {
            $catCM = $getRev($cmRange, null, $cat)->actual;
            $catPM = $getRev($pmRange, null, $cat)->actual;
            $catPYM = $getRev($pymRange, null, $cat)->actual;
            $catYTD = $getRev($ytdRange, null, $cat)->actual;
            $catPYTD = $getRev($pytdRange, null, $cat)->actual;

            $breakdown[] = [
                'name' => $cat,
                'mom' => $catPM > 0 ? round((($catCM - $catPM) / $catPM) * 100, 1) : 0,
                'yoy' => $catPYM > 0 ? round((($catCM - $catPYM) / $catPYM) * 100, 1) : 0,
                'ytd' => $catPYTD > 0 ? round((($catYTD - $catPYTD) / $catPYTD) * 100, 1) : 0,
            ];
        }

        $gaugeData = [
            ['title' => 'Revenue Total', 'actual' => floatval($totalCM->actual), 'target' => floatval($totalCM->target)],
            ['title' => 'Revenue Existing', 'actual' => floatval($existingCM->actual), 'target' => floatval($existingCM->target)],
            ['title' => 'Revenue New Sales', 'actual' => floatval($newSalesCM->actual), 'target' => floatval($newSalesCM->target)],
        ];

        $revenueTable = [
            [
                'label' => 'Total',
                'mtd' => floatval($totalCM->actual),
                'mom' => round($mom, 1),
                'yoy' => round($yoy, 1),
                'ytd' => floatval($totalYTD->actual),
            ],
            [
                'label' => 'Existing',
                'mtd' => floatval($existingCM->actual),
                'mom' => $calcPct($existingCM->actual, $existingPM->actual),
                'yoy' => $calcPct($existingCM->actual, $existingPYM->actual),
                'ytd' => floatval($existingYTD->actual),
            ],
            [
                'label' => 'New Sales',
                'mtd' => floatval($newSalesCM->actual),
                'mom' => $calcPct($newSalesCM->actual, $newSalesPM->actual),
                'yoy' => $calcPct($newSalesCM->actual, $newSalesPYM->actual),
                'ytd' => floatval($newSalesYTD->actual),
            ],
            [
                'label' => 'Broadband',
                'mtd' => floatval($bbCM->actual),
                'mom' => $calcPct($bbCM->actual, $bbPM->actual),
                'yoy' => $calcPct($bbCM->actual, $bbPYM->actual),
                'ytd' => floatval($bbYTD->actual),
            ],
        ];

        $bbPacks = ['Total BBA' => null, 'CVM (BTL)' => 'CVM(BTL)', 'Physical Voucher' => 'Physical Voucher', 'Core' => 'Core'];
        $bbPackTable = [];
        foreach ($bbPacks as $label => $packType) {
            $val = $getRev($cmRange, null, 'Broadband', $packType)->actual;
            $pmVal = $getRev($pmRange, null, 'Broadband', $packType)->actual;
            $pymVal = $getRev($pymRange, null, 'Broadband', $packType)->actual;
            $ytdVal = $getRev($ytdRange, null, 'Broadband', $packType)->actual;
            $bbPackTable[] = [
                'label' => $label,
                'mtd' => floatval($val),
                'mom' => $calcPct($val, $pmVal),
                'yoy' => $calcPct($val, $pymVal),
                'ytd' => floatval($ytdVal),
            ];
        }

        $driverMetrics = ['Playing User', 'Payload User', 'Payload All', 'Trx New Sales', 'Sell Out'];
        $driverTable = [];
        foreach ($driverMetrics as $metric) {
            $getDriver = function($range) use ($metric) {
                return DB::table('fact_drivers')
                    ->join('dim_dates', 'fact_drivers.dim_date_id', '=', 'dim_dates.id')
                    ->join('dim_metrics', 'fact_drivers.dim_metric_id', '=', 'dim_metrics.id')
                    ->where('dim_metrics.metric_name', $metric)
                    ->whereBetween('dim_dates.date', $range)
                    ->sum('value');
            };
            $val = $getDriver($cmRange);
            $pmVal = $getDriver($pmRange);
            $pymVal = $getDriver($pymRange);
            $ytdVal = $getDriver($ytdRange);
            $driverTable[] = [
                'label' => $metric,
                'mtd' => round($val, 2),
                'mom' => $calcPct($val, $pmVal),
                'yoy' => $calcPct($val, $pymVal),
                'ytd' => round($ytdVal, 2),
            ];
        }

        return response()->json([
            'gaugeData' => $gaugeData,
            'breakdown' => $breakdown,
            'revenueTable' => $revenueTable,
            'bbPackTable' => $bbPackTable,
            'driverTable' => $driverTable,
            'latestDate' => $cmRange[1],
        ]);
    }

    /**
     * Function khusus Controller untuk mengambil Total Revenue Actual vs Target (Gauge Chart)
     * 
     * @param Request $request
     * - year: int|string (misal: 2024 atau "2024")
     * - month: int|array|string (misal: 1, [1,2,3], atau "Januari - Maret")
     * - sales_type: string|null (misal: "BAU", "New Sales", atau null untuk Total)
     */
    public function getGaugeChartData(Request $request)
    {
        $year = $request->input('year', 2024);
        $monthParam = $request->input('month', 'Januari - Maret');
        $salesType = $request->input('sales_type', null);

        // 1. Parsing filter bulan ke array angka bulan (1..12)
        $monthNumbers = $this->parseMonthParam($monthParam);

        // 2. Query SUM actual_revenue dari tabel `fact_revenues` (JOIN dim_dates)
        $actualQuery = DB::table('fact_revenues')
            ->join('dim_dates', 'fact_revenues.dim_date_id', '=', 'dim_dates.id')
            ->where('dim_dates.year', $year)
            ->whereIn('dim_dates.month', $monthNumbers);

        if ($salesType) {
            $actualQuery->join('dim_sales_types', 'fact_revenues.dim_sales_type_id', '=', 'dim_sales_types.id')
                        ->where('dim_sales_types.type_name', $salesType);
        }

        $actualRevenue = (float) $actualQuery->sum('fact_revenues.actual_revenue');

        // 3. Query SUM target_revenue dari tabel `fact_targets`
        $targetQuery = DB::table('fact_targets')
            ->where('fact_targets.year', $year)
            ->whereIn('fact_targets.month', $monthNumbers);

        if ($salesType) {
            $targetQuery->join('dim_sales_types', 'fact_targets.dim_sales_type_id', '=', 'dim_sales_types.id')
                        ->where('dim_sales_types.type_name', $salesType);
        }

        $targetRevenue = (float) $targetQuery->sum('fact_targets.target_revenue');

        // 4. Hitung Persentase Pencapaian (Achievement Percentage)
        $achievementPercentage = $targetRevenue > 0 
            ? round(($actualRevenue / $targetRevenue) * 100, 2) 
            : 0.00;

        // 5. Format return response JSON
        return response()->json([
            'status' => 'success',
            'filters' => [
                'year' => (int) $year,
                'month' => $monthParam,
                'parsed_months' => $monthNumbers,
                'sales_type' => $salesType ?? 'Total',
            ],
            'data' => [
                'actual_revenue' => round($actualRevenue, 2),
                'target_revenue' => round($targetRevenue, 2),
                'achievement_percentage' => $achievementPercentage,
            ]
        ]);
    }

    /**
     * Helper untuk mem-parsing parameter bulan string/array/angka ke array angka bulan (1..12)
     */
    private function parseMonthParam($monthParam): array
    {
        if (is_numeric($monthParam)) {
            return [(int) $monthParam];
        }

        if (is_array($monthParam)) {
            return array_map('intval', $monthParam);
        }

        $monthMap = [
            'januari' => 1, 'january' => 1, 'jan' => 1,
            'februari' => 2, 'february' => 2, 'feb' => 2,
            'maret' => 3, 'march' => 3, 'mar' => 3,
            'april' => 4, 'apr' => 4,
            'mei' => 5, 'may' => 5,
            'juni' => 6, 'june' => 6, 'jun' => 6,
            'juli' => 7, 'july' => 7, 'jul' => 7,
            'agustus' => 8, 'august' => 8, 'aug' => 8, 'agu' => 8,
            'september' => 9, 'sep' => 9,
            'oktober' => 10, 'october' => 10, 'okt' => 10, 'oct' => 10,
            'november' => 11, 'nov' => 11,
            'desember' => 12, 'december' => 12, 'des' => 12, 'dec' => 12,
        ];

        // Format rentang string seperti "Januari - Maret"
        if (is_string($monthParam) && str_contains($monthParam, '-')) {
            $parts = array_map('trim', explode('-', strtolower($monthParam)));
            $startMonth = $monthMap[$parts[0]] ?? 1;
            $endMonth = $monthMap[$parts[1]] ?? 12;

            return range(min($startMonth, $endMonth), max($startMonth, $endMonth));
        }

        // String nama bulan tunggal seperti "Maret"
        $cleanMonth = strtolower(trim((string) $monthParam));
        if (isset($monthMap[$cleanMonth])) {
            return [$monthMap[$cleanMonth]];
        }

        return range(1, 12);
    }

    public function revenueTotal(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $year = $request->get('year', 2025);
        $month = $request->get('month', 12);
        
        $dateFormat = match($grain) {
            'Daily' => "DATE_FORMAT(dim_dates.date, '%Y-%m-%d')",
            'Weekly' => "DATE_FORMAT(dim_dates.date, '%x-W%v')",
            default => "DATE_FORMAT(dim_dates.date, '%Y-%m')",
        };

        $endDate = Carbon::create($year, $month, 1)->endOfMonth()->format('Y-m-d');
        $startDate = match($grain) {
            'Daily' => Carbon::create($year, $month, 1)->endOfMonth()->subDays(14)->format('Y-m-d'),
            'Weekly' => Carbon::create($year, $month, 1)->endOfMonth()->subWeeks(8)->format('Y-m-d'),
            default => Carbon::create($year, $month, 1)->endOfMonth()->subMonths(12)->format('Y-m-d'),
        };

        $data = DB::table('fact_revenues')
            ->join('dim_dates', 'fact_revenues.dim_date_id', '=', 'dim_dates.id')
            ->join('dim_products', 'fact_revenues.dim_product_id', '=', 'dim_products.id')
            ->whereBetween('dim_dates.date', [$startDate, $endDate])
            ->select(
                DB::raw("$dateFormat as label"),
                'dim_products.category',
                DB::raw('SUM(actual_revenue) as total')
            )
            ->groupBy('label', 'dim_products.category')
            ->orderBy('label')
            ->get();

        $formatted = [];
        foreach ($data as $row) {
            $label = $this->formatLabel($row->label, $grain);
            if (!isset($formatted[$label])) {
                $formatted[$label] = ['p' => $label];
            }
            $formatted[$label][$row->category] = floatval($row->total);
        }

        return response()->json(array_values($formatted));
    }

    public function revenueBySalesType(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $year = $request->get('year', 2025);
        $month = $request->get('month', 12);
        
        $dateFormat = match($grain) {
            'Daily' => "DATE_FORMAT(dim_dates.date, '%Y-%m-%d')",
            'Weekly' => "DATE_FORMAT(dim_dates.date, '%x-W%v')",
            default => "DATE_FORMAT(dim_dates.date, '%Y-%m')",
        };

        $endDate = Carbon::create($year, $month, 1)->endOfMonth()->format('Y-m-d');
        $startDate = match($grain) {
            'Daily' => Carbon::create($year, $month, 1)->endOfMonth()->subDays(14)->format('Y-m-d'),
            'Weekly' => Carbon::create($year, $month, 1)->endOfMonth()->subWeeks(8)->format('Y-m-d'),
            default => Carbon::create($year, $month, 1)->endOfMonth()->subMonths(12)->format('Y-m-d'),
        };

        $data = DB::table('fact_revenues')
            ->join('dim_dates', 'fact_revenues.dim_date_id', '=', 'dim_dates.id')
            ->join('dim_sales_types', 'fact_revenues.dim_sales_type_id', '=', 'dim_sales_types.id')
            ->whereBetween('dim_dates.date', [$startDate, $endDate])
            ->select(
                DB::raw("$dateFormat as label"),
                'dim_sales_types.type_name',
                DB::raw('SUM(actual_revenue) as total')
            )
            ->groupBy('label', 'dim_sales_types.type_name')
            ->orderBy('label')
            ->get();

        $formatted = [];
        foreach ($data as $row) {
            $label = $this->formatLabel($row->label, $grain);
            if (!isset($formatted[$label])) {
                $formatted[$label] = ['p' => $label];
            }
            $formatted[$label][$row->type_name] = floatval($row->total);
        }

        return response()->json(array_values($formatted));
    }

    public function revenueLos(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $year = $request->get('year', 2025);
        $month = $request->get('month', 12);
        
        $dateFormat = match($grain) {
            'Daily' => "DATE_FORMAT(dim_dates.date, '%Y-%m-%d')",
            'Weekly' => "DATE_FORMAT(dim_dates.date, '%x-W%v')",
            default => "DATE_FORMAT(dim_dates.date, '%Y-%m')",
        };

        $endDate = Carbon::create($year, $month, 1)->endOfMonth()->format('Y-m-d');
        $startDate = match($grain) {
            'Daily' => Carbon::create($year, $month, 1)->endOfMonth()->subDays(14)->format('Y-m-d'),
            'Weekly' => Carbon::create($year, $month, 1)->endOfMonth()->subWeeks(8)->format('Y-m-d'),
            default => Carbon::create($year, $month, 1)->endOfMonth()->subMonths(12)->format('Y-m-d'),
        };

        $data = DB::table('fact_revenues')
            ->join('dim_dates', 'fact_revenues.dim_date_id', '=', 'dim_dates.id')
            ->join('dim_sales_types', 'fact_revenues.dim_sales_type_id', '=', 'dim_sales_types.id')
            ->whereBetween('dim_dates.date', [$startDate, $endDate])
            ->select(
                DB::raw("$dateFormat as label"),
                'dim_sales_types.type_name',
                DB::raw('SUM(actual_revenue) as total')
            )
            ->groupBy('label', 'dim_sales_types.type_name')
            ->orderBy('label')
            ->get();

        $formatted = [];
        foreach ($data as $row) {
            $label = $this->formatLabel($row->label, $grain);
            if (!isset($formatted[$label])) {
                $formatted[$label] = ['p' => $label];
            }
            $key = $row->type_name === 'BAU' ? 'Existing' : 'New Sales';
            $formatted[$label][$key] = floatval($row->total);
        }

        return response()->json(array_values($formatted));
    }

    public function broadbandPack(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $year = $request->get('year', 2025);
        $month = $request->get('month', 12);
        
        $dateFormat = match($grain) {
            'Daily' => "DATE_FORMAT(dim_dates.date, '%Y-%m-%d')",
            'Weekly' => "DATE_FORMAT(dim_dates.date, '%x-W%v')",
            default => "DATE_FORMAT(dim_dates.date, '%Y-%m')",
        };

        $endDate = Carbon::create($year, $month, 1)->endOfMonth()->format('Y-m-d');
        $startDate = match($grain) {
            'Daily' => Carbon::create($year, $month, 1)->endOfMonth()->subDays(14)->format('Y-m-d'),
            'Weekly' => Carbon::create($year, $month, 1)->endOfMonth()->subWeeks(8)->format('Y-m-d'),
            default => Carbon::create($year, $month, 1)->endOfMonth()->subMonths(12)->format('Y-m-d'),
        };

        $data = DB::table('fact_revenues')
            ->join('dim_dates', 'fact_revenues.dim_date_id', '=', 'dim_dates.id')
            ->join('dim_products', 'fact_revenues.dim_product_id', '=', 'dim_products.id')
            ->where('dim_products.category', 'Broadband')
            ->whereNotNull('dim_products.broadband_pack_type')
            ->whereBetween('dim_dates.date', [$startDate, $endDate])
            ->select(
                DB::raw("$dateFormat as label"),
                'dim_products.broadband_pack_type',
                DB::raw('SUM(actual_revenue) as total')
            )
            ->groupBy('label', 'dim_products.broadband_pack_type')
            ->orderBy('label')
            ->get();

        $formatted = [];
        foreach ($data as $row) {
            $label = $this->formatLabel($row->label, $grain);
            if (!isset($formatted[$label])) {
                $formatted[$label] = ['p' => $label];
            }
            $formatted[$label][$row->broadband_pack_type] = floatval($row->total);
        }

        return response()->json(array_values($formatted));
    }

    public function prepaidBroadband(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $year = $request->get('year', 2025);
        $month = $request->get('month', 12);
        
        $dateFormat = match($grain) {
            'Daily' => "DATE_FORMAT(dim_dates.date, '%Y-%m-%d')",
            'Weekly' => "DATE_FORMAT(dim_dates.date, '%x-W%v')",
            default => "DATE_FORMAT(dim_dates.date, '%Y-%m')",
        };

        $endDate = Carbon::create($year, $month, 1)->endOfMonth()->format('Y-m-d');
        $startDate = match($grain) {
            'Daily' => Carbon::create($year, $month, 1)->endOfMonth()->subDays(14)->format('Y-m-d'),
            'Weekly' => Carbon::create($year, $month, 1)->endOfMonth()->subWeeks(8)->format('Y-m-d'),
            default => Carbon::create($year, $month, 1)->endOfMonth()->subMonths(12)->format('Y-m-d'),
        };

        $data = DB::table('fact_revenues')
            ->join('dim_dates', 'fact_revenues.dim_date_id', '=', 'dim_dates.id')
            ->join('dim_products', 'fact_revenues.dim_product_id', '=', 'dim_products.id')
            ->where('dim_products.category', 'Broadband')
            ->whereNotNull('dim_products.broadband_pack_type')
            ->whereBetween('dim_dates.date', [$startDate, $endDate])
            ->select(
                DB::raw("$dateFormat as label"),
                DB::raw("CASE 
                    WHEN dim_products.broadband_pack_type IN ('Acquisition', 'Core') THEN 'Core & Acquisition'
                    WHEN dim_products.broadband_pack_type = 'CVM(BTL)' THEN 'CVM (BTL)'
                    ELSE 'Others'
                END as pack_group"),
                DB::raw('SUM(actual_revenue) as total')
            )
            ->groupBy('label', 'pack_group')
            ->orderBy('label')
            ->get();

        $formatted = [];
        foreach ($data as $row) {
            $label = $this->formatLabel($row->label, $grain);
            if (!isset($formatted[$label])) {
                $formatted[$label] = ['p' => $label];
            }
            $formatted[$label][$row->pack_group] = floatval($row->total);
        }

        return response()->json(array_values($formatted));
    }
    
    public function driverTrend(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $metric = $request->get('metric', 'Playing User');
        $year = $request->get('year', 2025);
        $month = $request->get('month', 12);
        
        $dateFormat = match($grain) {
            'Daily' => "DATE_FORMAT(dim_dates.date, '%Y-%m-%d')",
            'Weekly' => "DATE_FORMAT(dim_dates.date, '%x-W%v')",
            default => "DATE_FORMAT(dim_dates.date, '%Y-%m')",
        };

        $endDate = Carbon::create($year, $month, 1)->endOfMonth()->format('Y-m-d');
        $startDate = match($grain) {
            'Daily' => Carbon::create($year, $month, 1)->endOfMonth()->subDays(14)->format('Y-m-d'),
            'Weekly' => Carbon::create($year, $month, 1)->endOfMonth()->subWeeks(8)->format('Y-m-d'),
            default => Carbon::create($year, $month, 1)->endOfMonth()->subMonths(12)->format('Y-m-d'),
        };

        $data = DB::table('fact_drivers')
            ->join('dim_dates', 'fact_drivers.dim_date_id', '=', 'dim_dates.id')
            ->join('dim_metrics', 'fact_drivers.dim_metric_id', '=', 'dim_metrics.id')
            ->where('dim_metrics.metric_name', $metric)
            ->whereBetween('dim_dates.date', [$startDate, $endDate])
            ->select(
                DB::raw("$dateFormat as label"),
                DB::raw('SUM(value) as total')
            )
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        $formatted = [];
        foreach ($data as $row) {
            $label = $this->formatLabel($row->label, $grain);
            $formatted[] = ['p' => $label, 'v' => round($row->total, 2)];
        }

        return response()->json($formatted);
    }

    private function formatLabel(string $rawLabel, string $grain): string
    {
        return match($grain) {
            'Daily' => Carbon::parse($rawLabel)->format('d M'),
            'Weekly' => $rawLabel, 
            default => Carbon::parse($rawLabel . '-01')->format('M Y'),
        };
    }
}
