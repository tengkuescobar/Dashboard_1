<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fact_revenues', function (Blueprint $table) {
            if (Schema::hasColumn('fact_revenues', 'target_revenue')) {
                $table->dropColumn('target_revenue');
            }
        });
    }

    public function down(): void
    {
        Schema::table('fact_revenues', function (Blueprint $table) {
            $table->decimal('target_revenue', 20, 2)->default(0)->after('actual_revenue');
        });
    }
};
