<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DimSalesType extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'dim_sales_types';

    protected $fillable = [
        'type_name',
    ];

    public function targets(): HasMany
    {
        return $this->hasMany(FactTarget::class, 'dim_sales_type_id');
    }
}
