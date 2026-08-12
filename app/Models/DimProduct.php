<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DimProduct extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'dim_products';

    protected $fillable = [
        'category',
        'broadband_pack_type',
    ];

    public function targets(): HasMany
    {
        return $this->hasMany(FactTarget::class, 'dim_product_id');
    }
}
