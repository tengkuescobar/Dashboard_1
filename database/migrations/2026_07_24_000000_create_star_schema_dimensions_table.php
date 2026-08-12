<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dim_dates', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->integer('year');
            $table->integer('month');
            $table->integer('quarter');
            $table->integer('day_of_week');
        });

        Schema::create('dim_products', function (Blueprint $table) {
            $table->id();
            $table->string('category'); // e.g. "Broadband", "Digital", "Others"
            $table->string('broadband_pack_type')->nullable(); // e.g. "Core", "CVM"
        });

        Schema::create('dim_sales_types', function (Blueprint $table) {
            $table->id();
            $table->string('type_name'); // e.g. "BAU", "New Sales"
        });

        Schema::create('dim_metrics', function (Blueprint $table) {
            $table->id();
            $table->string('metric_name'); // e.g. "Playing User"
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dim_metrics');
        Schema::dropIfExists('dim_sales_types');
        Schema::dropIfExists('dim_products');
        Schema::dropIfExists('dim_dates');
    }
};
