<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'price',
        'platform_fee_rate',
        'delivery_time',
        'terms',
        'active',
    ];

    protected $casts = [
        'price' => 'integer',
        'platform_fee_rate' => 'decimal:4',
        'delivery_time' => 'integer',
        'active' => 'boolean',
    ];

    public function artist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'artist_id');
    }
}
