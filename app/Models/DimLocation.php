<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DimLocation extends Model
{
    protected $table = 'dim_locations';

    protected $fillable = [
        'area_name',
        'region_name',
    ];

    /**
     * Get all fact_revenues entries for this location.
     */
    public function revenues()
    {
        return $this->hasMany(\Illuminate\Support\Facades\DB::class);
    }

    /**
     * Scope: Filter by area name.
     */
    public function scopeArea($query, string $areaName)
    {
        return $query->where('area_name', $areaName);
    }

    /**
     * Scope: Filter by region name.
     */
    public function scopeRegion($query, string $regionName)
    {
        return $query->where('region_name', $regionName);
    }

    /**
     * Get a list of all unique area names.
     */
    public static function getAreas(): array
    {
        return static::query()
            ->select('area_name')
            ->distinct()
            ->orderBy('area_name')
            ->pluck('area_name')
            ->toArray();
    }

    /**
     * Get all regions under a specific area.
     */
    public static function getRegionsByArea(string $areaName): array
    {
        return static::query()
            ->where('area_name', $areaName)
            ->orderBy('region_name')
            ->pluck('region_name')
            ->toArray();
    }
}
