<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dim_locations', function (Blueprint $table) {
            $table->id();
            $table->string('area_name');    // e.g. "Area 1 Sumatera"
            $table->string('region_name');  // e.g. "Region Sumbagut"
            $table->timestamps();

            $table->index('area_name');
            $table->unique(['area_name', 'region_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dim_locations');
    }
};
