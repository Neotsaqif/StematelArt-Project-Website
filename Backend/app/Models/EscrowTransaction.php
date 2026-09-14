<?php

namespace App\Models;

use App\Enums\EscrowTransactionStatus;
use App\Enums\EscrowTransactionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EscrowTransaction extends Model
{
    use HasFactory;

    protected $fillable = [];

    protected $casts = [
        'amount' => 'integer',
        'type' => EscrowTransactionType::class,
        'status' => EscrowTransactionStatus::class,
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(CommissionOrder::class, 'order_id');
    }
}
