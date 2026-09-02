<?php

namespace App\Services;

use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
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

    private function getChartDateRange(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $year = (int) $request->get('year', date('Y'));
        $month = $request->get('month', 'All');
        $quarter = $request->get('quarter', 'All');

        if ($grain === 'Daily') {
            if ($month !== 'All') {
                $m = is_numeric($month) ? (int)$month : date('n', strtotime($month));
                $startDate = Carbon::create($year, $m, 1)->format('Y-m-d');
                $endDate = Carbon::create($year, $m, 1)->endOfMonth()->format('Y-m-d');
            } else if ($quarter !== 'All') {
                $qStartMonth = ((int)str_replace('Q', '', $quarter) - 1) * 3 + 1;
                $m = $qStartMonth + 2; 
                $startDate = Carbon::create($year, $m, 1)->format('Y-m-d');
                $endDate = Carbon::create($year, $m, 1)->endOfMonth()->format('Y-m-d');
            } else {
                $startDate = Carbon::create($year, 12, 1)->format('Y-m-d');
                $endDate = Carbon::create($year, 12, 31)->format('Y-m-d');
            }
        } else if ($grain === 'Weekly') {
            if ($quarter !== 'All') {
                $qStartMonth = ((int)str_replace('Q', '', $quarter) - 1) * 3 + 1;
                $startDate = Carbon::create($year, $qStartMonth, 1)->format('Y-m-d');
                $endDate = Carbon::create($year, $qStartMonth + 2, 1)->endOfMonth()->format('Y-m-d');
            } else if ($month !== 'All') {
                $m = is_numeric($month) ? (int)$month : date('n', strtotime($month));
                $startDate = Carbon::create($year, $m, 1)->format('Y-m-d');
                $endDate = Carbon::create($year, $m, 1)->endOfMonth()->format('Y-m-d');
            } else {
                $startDate = Carbon::create($year, 1, 1)->format('Y-m-d');
                $endDate = Carbon::create($year, 12, 31)->format('Y-m-d');
            }
        } else if ($grain === 'Quarterly') {
            $startDate = Carbon::create($year, 1, 1)->format('Y-m-d');
            if ($quarter !== 'All') {
                $qStartMonth = ((int)str_replace('Q', '', $quarter) - 1) * 3 + 1;
                $startDate = Carbon::create($year, $qStartMonth, 1)->format('Y-m-d');
                $endDate = Carbon::create($year, $qStartMonth + 2, 1)->endOfMonth()->format('Y-m-d');
            } else if ($month !== 'All') {
                $m = is_numeric($month) ? (int)$month : date('n', strtotime($month));
                $q = ceil($m / 3);
                $qStartMonth = ($q - 1) * 3 + 1;
                $startDate = Carbon::create($year, $qStartMonth, 1)->format('Y-m-d');
                $endDate = Carbon::create($year, $qStartMonth + 2, 1)->endOfMonth()->format('Y-m-d');
            } else {
                $endDate = Carbon::create($year, 12, 31)->format('Y-m-d');
            }
        } else {
            $startDate = Carbon::create($year, 1, 1)->format('Y-m-d');
            if ($month !== 'All') {
                $m = is_numeric($month) ? (int)$month : date('n', strtotime($month));
                $endDate = Carbon::create($year, $m, 1)->endOfMonth()->format('Y-m-d');
            } else {
                $endDate = Carbon::create($year, 12, 31)->format('Y-m-d');
            }
        }
        return [$startDate, $endDate];
    }

    private function formatLabel(string $rawLabel, string $grain): string
    {
        return match($grain) {
            'Daily' => Carbon::parse($rawLabel)->format('d M'),
            'Weekly' => $rawLabel, 
            'Quarterly' => $rawLabel,
            default => Carbon::parse($rawLabel . '-01')->format('M Y'),
        };
    }

    private function getDateFormat(string $grain): string
    {
        return match($grain) {
            'Daily' => "DATE_FORMAT(dim_dates.date, '%Y-%m-%d')",
            'Weekly' => "DATE_FORMAT(dim_dates.date, '%x-W%v')",
            'Quarterly' => "CONCAT('Q', QUARTER(dim_dates.date), ' ', YEAR(dim_dates.date))",
            default => "DATE_FORMAT(dim_dates.date, '%Y-%m')",
        };
    }

    public function summary(Request $request)
    {
        $year = $request->get('year', 2025);
        $month = $request->get('month', 'All');
        $quarter = $request->get('quarter', 'All');
        
        $isFullYearOrQuarter = ($month === 'All');

        if ($month === 'All') {
            if ($quarter !== 'All') {
                $q = (int) str_replace('Q', '', $quarter);
                $month = $q * 3;
            } else {
                $month = 12;
            }
        }

        $cmRange = $this->getDateRange($year, $month, 'current_month');
        $pmRange = $this->getDateRange($year, $month, 'prev_month');
        $pymRange = $this->getDateRange($year, $month, 'prev_year_month');
        $ytdRange = $this->getDateRange($year, $month, 'ytd');
        $pytdRange = $this->getDateRange($year, $month, 'prev_ytd');

        $getRev = function($range, $salesType = null, $category = null, $packType = null) {
            $startDate = $range[0];
            $endDate = $range[1];

            $qActual = DB::table('fact_revenues')
                ->join('dim_dates', 'fact_revenues.dim_date_id', '=', 'dim_dates.id')
                ->join('dim_products', 'fact_revenues.dim_product_id', '=', 'dim_products.id')
                ->join('dim_sales_types', 'fact_revenues.dim_sales_type_id', '=', 'dim_sales_types.id')
                ->whereBetween('dim_dates.date', [$startDate, $endDate]);
            
            if ($salesType) $qActual->where('dim_sales_types.type_name', $salesType);
            if ($category) $qActual->where('dim_products.category', $category);
            if ($packType) $qActual->where('dim_products.broadband_pack_type', $packType);
            
            $actual = (float) $qActual->sum('actual_revenue');

            $startCarbon = Carbon::parse($startDate);
            $endCarbon = Carbon::parse($endDate);

            // Mathematically calculate total target over the given range month by month
            $totalTarget = 0.0;
            
            $cursor = $startCarbon->copy()->startOfMonth();
            $endMonthLimit = $endCarbon->copy()->startOfMonth();
            
            while ($cursor->lte($endMonthLimit)) {
                $qTarget = DB::table('fact_targets')
                    ->where('fact_targets.year', $cursor->year)
                    ->where('fact_targets.month', $cursor->month)
                    ->whereNull('fact_targets.dim_product_id');

                if ($salesType) {
                    $qTarget->join('dim_sales_types', 'fact_targets.dim_sales_type_id', '=', 'dim_sales_types.id')
                            ->where('dim_sales_types.type_name', $salesType);
                }
                
                $monthlyTarget = (float) $qTarget->sum('target_revenue');
                
                $daysInMonth = $cursor->daysInMonth;
                
                $startDay = ($cursor->month === $startCarbon->month && $cursor->year === $startCarbon->year)
                    ? $startCarbon->day
                    : 1;
                    
                $endDay = ($cursor->month === $endCarbon->month && $cursor->year === $endCarbon->year)
                    ? $endCarbon->day
                    : $daysInMonth;
                    
                $activeDays = max(0, $endDay - $startDay + 1);
                $ratio = $daysInMonth > 0 ? ($activeDays / $daysInMonth) : 1;
                
                $totalTarget += ($monthlyTarget * $ratio);
                
                $cursor->addMonth();
            }

            return (object)[
                'actual' => $actual,
                'target' => $totalTarget
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

        $selectedTotal = $isFullYearOrQuarter ? $totalYTD : $totalCM;
        $selectedExisting = $isFullYearOrQuarter ? $existingYTD : $existingCM;
        $selectedNewSales = $isFullYearOrQuarter ? $newSalesYTD : $newSalesCM;

        $gaugeData = [
            ['title' => 'Revenue Total', 'actual' => floatval($selectedTotal->actual), 'target' => floatval($selectedTotal->target)],
            ['title' => 'Revenue Existing', 'actual' => floatval($selectedExisting->actual), 'target' => floatval($selectedExisting->target)],
            ['title' => 'Revenue New Sales', 'actual' => floatval($selectedNewSales->actual), 'target' => floatval($selectedNewSales->target)],
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

        return [
            'gaugeData' => $gaugeData,
            'breakdown' => $breakdown,
            'revenueTable' => $revenueTable,
            'bbPackTable' => $bbPackTable,
            'driverTable' => $driverTable,
            'latestDate' => $cmRange[1],
        ];
    }

    public function getGaugeChartData(Request $request)
    {
        $year = $request->input('year', 2024);
        $monthParam = $request->input('month', 'Januari - Maret');
        $salesType = $request->input('sales_type', null);

        $monthNumbers = $this->parseMonthParam($monthParam);

        $actualQuery = DB::table('fact_revenues')
            ->join('dim_dates', 'fact_revenues.dim_date_id', '=', 'dim_dates.id')
            ->where('dim_dates.year', $year)
            ->whereIn('dim_dates.month', $monthNumbers);

        if ($salesType) {
            $actualQuery->join('dim_sales_types', 'fact_revenues.dim_sales_type_id', '=', 'dim_sales_types.id')
                        ->where('dim_sales_types.type_name', $salesType);
        }

        $actualRevenue = (float) $actualQuery->sum('fact_revenues.actual_revenue');

        $targetQuery = DB::table('fact_targets')
            ->where('fact_targets.year', $year)
            ->whereIn('fact_targets.month', $monthNumbers)
            ->whereNull('fact_targets.dim_product_id');

        if ($salesType) {
            $targetQuery->join('dim_sales_types', 'fact_targets.dim_sales_type_id', '=', 'dim_sales_types.id')
                        ->where('dim_sales_types.type_name', $salesType);
        }

        $targetRevenue = (float) $targetQuery->sum('fact_targets.target_revenue');

        $achievementPercentage = $targetRevenue > 0 
            ? round(($actualRevenue / $targetRevenue) * 100, 2) 
            : 0.00;

        return [
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
        ];
    }

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

        if (is_string($monthParam) && str_contains($monthParam, '-')) {
            $parts = array_map('trim', explode('-', strtolower($monthParam)));
            $startMonth = $monthMap[$parts[0]] ?? 1;
            $endMonth = $monthMap[$parts[1]] ?? 12;

            return range(min($startMonth, $endMonth), max($startMonth, $endMonth));
        }

        $cleanMonth = strtolower(trim((string) $monthParam));
        if (isset($monthMap[$cleanMonth])) {
            return [$monthMap[$cleanMonth]];
        }

        return range(1, 12);
    }

    public function revenueTotal(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $dateFormat = $this->getDateFormat($grain);
        [$startDate, $endDate] = $this->getChartDateRange($request);

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

        return array_values($formatted);
    }

    public function revenueBySalesType(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $dateFormat = $this->getDateFormat($grain);
        [$startDate, $endDate] = $this->getChartDateRange($request);

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

        return array_values($formatted);
    }

    public function revenueLos(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $dateFormat = $this->getDateFormat($grain);
        [$startDate, $endDate] = $this->getChartDateRange($request);

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

        return array_values($formatted);
    }

    public function broadbandPack(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $dateFormat = $this->getDateFormat($grain);
        [$startDate, $endDate] = $this->getChartDateRange($request);

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

        return array_values($formatted);
    }

    public function prepaidBroadband(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $dateFormat = $this->getDateFormat($grain);
        [$startDate, $endDate] = $this->getChartDateRange($request);

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

        return array_values($formatted);
    }
    
    public function driverTrend(Request $request)
    {
        $grain = $request->get('grain', 'Monthly');
        $metric = $request->get('metric', 'Playing User');
        $dateFormat = $this->getDateFormat($grain);
        [$startDate, $endDate] = $this->getChartDateRange($request);

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

        return $formatted;
    }

    public function varianceAnalysis(Request $request)
    {
        $year = (int) $request->get('year', 2025);
        
        $data = DB::table('fact_revenues')
            ->join('dim_dates', 'fact_revenues.dim_date_id', '=', 'dim_dates.id')
            ->whereIn('dim_dates.year', [$year - 1, $year])
            ->select(
                'dim_dates.year',
                'dim_dates.month',
                DB::raw('SUM(actual_revenue) as total')
            )
            ->groupBy('dim_dates.year', 'dim_dates.month')
            ->get();
            
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $result = [];
        
        for ($i = 1; $i <= 12; $i++) {
            $prev = $data->where('year', $year - 1)->where('month', $i)->first();
            $curr = $data->where('year', $year)->where('month', $i)->first();
            
            $result[] = [
                'month' => $months[$i - 1],
                'previous' => $prev ? (float) $prev->total / 1000000000 : 0,
                'current' => $curr ? (float) $curr->total / 1000000000 : 0,
            ];
        }
        
        return $result;
    }
}
