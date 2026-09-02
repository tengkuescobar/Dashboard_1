<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fact_targets', function (Blueprint $table) {
            $table->id();
            $table->integer('year');
            $table->integer('month'); // 1 - 12
            $table->foreignId('dim_sales_type_id')->nullable()->constrained('dim_sales_types')->onDelete('cascade');
            $table->foreignId('dim_product_id')->nullable()->constrained('dim_products')->onDelete('cascade');
            $table->decimal('target_revenue', 20, 2)->default(0);
            $table->timestamps();

            $table->index(['year', 'month']);
            $table->index(['year', 'month', 'dim_sales_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fact_targets');
    }
};
