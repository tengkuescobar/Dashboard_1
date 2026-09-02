<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add indexes to speed up dashboard queries.
     */
    public function up(): void
    {
        // Composite index on fact_revenues for the most common JOIN + filter pattern
        Schema::table('fact_revenues', function (Blueprint $table) {
            $table->index(['dim_date_id', 'dim_product_id', 'dim_sales_type_id'], 'idx_rev_date_product_sales');
        });

        // fact_drivers composite index
        Schema::table('fact_drivers', function (Blueprint $table) {
            $table->index(['dim_date_id', 'dim_metric_id'], 'idx_drv_date_metric');
        });

        // dim_dates: index on date column (used in whereBetween), and year+month (used in target queries)
        Schema::table('dim_dates', function (Blueprint $table) {
            $table->index('date', 'idx_dim_dates_date');
            $table->index(['year', 'month'], 'idx_dim_dates_year_month');
        });

        // dim_products: index on category and broadband_pack_type (used in WHERE filters)
        Schema::table('dim_products', function (Blueprint $table) {
            $table->index('category', 'idx_dim_products_category');
            $table->index('broadband_pack_type', 'idx_dim_products_pack_type');
        });

        // dim_sales_types: index on type_name (used in WHERE filters)
        Schema::table('dim_sales_types', function (Blueprint $table) {
            $table->index('type_name', 'idx_dim_sales_types_name');
        });

        // fact_targets: composite index for year+month lookups
        Schema::table('fact_targets', function (Blueprint $table) {
            $table->index(['year', 'month', 'dim_sales_type_id', 'dim_product_id'], 'idx_targets_year_month_sales_product');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fact_revenues', function (Blueprint $table) {
            $table->dropIndex('idx_rev_date_product_sales');
        });
        Schema::table('fact_drivers', function (Blueprint $table) {
            $table->dropIndex('idx_drv_date_metric');
        });
        Schema::table('dim_dates', function (Blueprint $table) {
            $table->dropIndex('idx_dim_dates_date');
            $table->dropIndex('idx_dim_dates_year_month');
        });
        Schema::table('dim_products', function (Blueprint $table) {
            $table->dropIndex('idx_dim_products_category');
            $table->dropIndex('idx_dim_products_pack_type');
        });
        Schema::table('dim_sales_types', function (Blueprint $table) {
            $table->dropIndex('idx_dim_sales_types_name');
        });
        Schema::table('fact_targets', function (Blueprint $table) {
            $table->dropIndex('idx_targets_year_month_sales_product');
        });
    }
};

