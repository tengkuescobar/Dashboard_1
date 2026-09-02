<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\FactTarget;
use App\Models\DimSalesType;
use Carbon\Carbon;

class TargetController extends Controller
{
    /**
     * Get 12-month targets for a given year.
     */
    public function index(Request $request)
    {
        $year = (int) $request->get('year', 2025);
        $month = $request->get('month');

        $bauTypeId = DB::table('dim_sales_types')->where('type_name', 'BAU')->value('id');
        $newSalesTypeId = DB::table('dim_sales_types')->where('type_name', 'New Sales')->value('id');

        $targetsQuery = DB::table('fact_targets')
            ->where('year', $year);

        if ($month && is_numeric($month)) {
            $targetsQuery->where('month', (int) $month);
        }

        $rawTargets = $targetsQuery->get();

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        $results = [];
        for ($m = 1; $m <= 12; $m++) {
            if ($month && is_numeric($month) && (int) $month !== $m) {
                continue;
            }

            $bauRow = $rawTargets->first(fn($t) => $t->month == $m && $t->dim_sales_type_id == $bauTypeId);
            $nsRow = $rawTargets->first(fn($t) => $t->month == $m && $t->dim_sales_type_id == $newSalesTypeId);

            $existingVal = $bauRow ? (float) $bauRow->target_revenue : 0.0;
            $newSalesVal = $nsRow ? (float) $nsRow->target_revenue : 0.0;
            $totalVal = $existingVal + $newSalesVal;

            $results[] = [
                'year' => $year,
                'month' => $m,
                'month_name' => $monthNames[$m],
                'month_short' => substr($monthNames[$m], 0, 3),
                'existing_target' => $existingVal,
                'existing_target_bn' => round($existingVal / 1000000000, 2),
                'new_sales_target' => $newSalesVal,
                'new_sales_target_bn' => round($newSalesVal / 1000000000, 2),
                'total_target' => $totalVal,
                'total_target_bn' => round($totalVal / 1000000000, 2),
                'is_set' => ($bauRow !== null || $nsRow !== null),
                'updated_at' => $bauRow?->updated_at ?? $nsRow?->updated_at,
            ];
        }

        return response()->json([
            'status' => 'success',
            'year' => $year,
            'data' => $results,
        ]);
    }

    /**
     * Store or update target for a specific month.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:2035',
            'month' => 'required|integer|min:1|max:12',
            'existing_target' => 'required|numeric|min:0',
            'new_sales_target' => 'required|numeric|min:0',
        ]);

        $year = (int) $validated['year'];
        $month = (int) $validated['month'];
        $existingTarget = (float) $validated['existing_target'];
        $newSalesTarget = (float) $validated['new_sales_target'];

        $bauTypeId = DB::table('dim_sales_types')->where('type_name', 'BAU')->value('id');
        $newSalesTypeId = DB::table('dim_sales_types')->where('type_name', 'New Sales')->value('id');

        DB::transaction(function () use ($year, $month, $existingTarget, $newSalesTarget, $bauTypeId, $newSalesTypeId) {
            // Upsert BAU (Existing)
            $this->upsertTarget($year, $month, $bauTypeId, $existingTarget);

            // Upsert New Sales
            $this->upsertTarget($year, $month, $newSalesTypeId, $newSalesTarget);
        });

        return response()->json([
            'status' => 'success',
            'message' => "Target untuk Bulan {$month} Tahun {$year} berhasil diperbarui.",
            'data' => [
                'year' => $year,
                'month' => $month,
                'existing_target' => $existingTarget,
                'new_sales_target' => $newSalesTarget,
                'total_target' => $existingTarget + $newSalesTarget,
            ]
        ]);
    }

    /**
     * Bulk store or apply targets to multiple/all months.
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:2035',
            'apply_to_all_months' => 'nullable|boolean',
            'existing_target' => 'nullable|numeric|min:0',
            'new_sales_target' => 'nullable|numeric|min:0',
            'months' => 'nullable|array',
            'months.*.month' => 'required_with:months|integer|min:1|max:12',
            'months.*.existing_target' => 'required_with:months|numeric|min:0',
            'months.*.new_sales_target' => 'required_with:months|numeric|min:0',
        ]);

        $year = (int) $validated['year'];
        $bauTypeId = DB::table('dim_sales_types')->where('type_name', 'BAU')->value('id');
        $newSalesTypeId = DB::table('dim_sales_types')->where('type_name', 'New Sales')->value('id');

        DB::transaction(function () use ($validated, $year, $bauTypeId, $newSalesTypeId) {
            if (!empty($validated['apply_to_all_months'])) {
                $existing = (float) ($validated['existing_target'] ?? 0);
                $newSales = (float) ($validated['new_sales_target'] ?? 0);

                for ($m = 1; $m <= 12; $m++) {
                    $this->upsertTarget($year, $m, $bauTypeId, $existing);
                    $this->upsertTarget($year, $m, $newSalesTypeId, $newSales);
                }
            } elseif (!empty($validated['months'])) {
                foreach ($validated['months'] as $mItem) {
                    $m = (int) $mItem['month'];
                    $existing = (float) $mItem['existing_target'];
                    $newSales = (float) $mItem['new_sales_target'];

                    $this->upsertTarget($year, $m, $bauTypeId, $existing);
                    $this->upsertTarget($year, $m, $newSalesTypeId, $newSales);
                }
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => "Target tahun {$year} berhasil diperbarui secara massal.",
        ]);
    }

    /**
     * Delete/reset target for a given month or entire year.
     */
    public function destroy(Request $request)
    {
        $year = (int) $request->input('year', 2025);
        $month = $request->input('month');

        $query = DB::table('fact_targets')->where('year', $year);

        if ($month && is_numeric($month)) {
            $query->where('month', (int) $month);
            $query->delete();
            $msg = "Target untuk Bulan {$month} Tahun {$year} berhasil di-reset.";
        } else {
            $query->delete();
            $msg = "Seluruh Target Tahun {$year} berhasil di-reset.";
        }

        return response()->json([
            'status' => 'success',
            'message' => $msg,
        ]);
    }

    /**
     * Helper to upsert a target row.
     */
    private function upsertTarget(int $year, int $month, int $salesTypeId, float $targetRevenue)
    {
        $now = Carbon::now();
        $existing = DB::table('fact_targets')
            ->where('year', $year)
            ->where('month', $month)
            ->where('dim_sales_type_id', $salesTypeId)
            ->first();

        if ($existing) {
            DB::table('fact_targets')
                ->where('id', $existing->id)
                ->update([
                    'target_revenue' => $targetRevenue,
                    'updated_at' => $now,
                ]);
        } else {
            DB::table('fact_targets')->insert([
                'year' => $year,
                'month' => $month,
                'dim_sales_type_id' => $salesTypeId,
                'dim_product_id' => null,
                'target_revenue' => $targetRevenue,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
