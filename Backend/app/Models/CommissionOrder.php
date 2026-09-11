<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\CommissionOrderStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommissionOrder extends Model
{
    use HasFactory;

    /**
     * Fields that are NOT mass assignable for security.
     * These fields must be set by server-side logic only:
     * - buyer_id (from authenticated user)
     * - artist_id (from package.artist_id)
     * - amount (from package.price)
     * - platform_fee_amount (calculated server-side)
     * - artist_payout_amount (calculated server-side)
     * - status (set by state machine)
     */
    protected $fillable = [
        'package_id',
        'brief',
        'reference_image',
        'deadline_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'platform_fee_amount' => 'integer',
        'artist_payout_amount' => 'integer',
        'deadline_at' => 'datetime',
        'status' => CommissionOrderStatus::class,
        'payment_created_at' => 'datetime',
    ];

    /**
     * Commission package that this order is based on.
     */
    public function package(): BelongsTo
    {
        return $this->belongsTo(CommissionPackage::class, 'package_id');
    }

    /**
     * User who purchased this commission (buyer).
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * Artist who will fulfill this commission.
     */
    public function artist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'artist_id');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class, 'order_id');
    }
}
