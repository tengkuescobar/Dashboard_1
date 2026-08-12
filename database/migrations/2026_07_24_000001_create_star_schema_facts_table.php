<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fact_revenues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dim_date_id')->constrained('dim_dates')->onDelete('cascade');
            $table->foreignId('dim_product_id')->constrained('dim_products')->onDelete('cascade');
            $table->foreignId('dim_sales_type_id')->constrained('dim_sales_types')->onDelete('cascade');
            $table->decimal('actual_revenue', 20, 2);
            $table->decimal('target_revenue', 20, 2);
        });

        Schema::create('fact_drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dim_date_id')->constrained('dim_dates')->onDelete('cascade');
            $table->foreignId('dim_metric_id')->constrained('dim_metrics')->onDelete('cascade');
            $table->decimal('value', 20, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fact_drivers');
        Schema::dropIfExists('fact_revenues');
    }
};
