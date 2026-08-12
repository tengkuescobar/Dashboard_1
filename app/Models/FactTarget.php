<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FactTarget extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'fact_targets';

    protected $fillable = [
        'year',
        'month',
        'dim_product_id',
        'dim_sales_type_id',
        'target_revenue',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'target_revenue' => 'float',
    ];

    /**
     * Relasi ke Tabel Dimensi Produk (dim_products)
     */
    public function dimProduct(): BelongsTo
    {
        return $this->belongsTo(DimProduct::class, 'dim_product_id');
    }

    /**
     * Relasi ke Tabel Dimensi Jenis Penjualan (dim_sales_types)
     */
    public function dimSalesType(): BelongsTo
    {
        return $this->belongsTo(DimSalesType::class, 'dim_sales_type_id');
    }
}
