<?php

namespace App\Enums;

enum CommissionOrderStatus: string
{
    case PendingPayment = 'pending_payment';
    case Paid = 'paid';
    case InProgress = 'in_progress';
    case Delivered = 'delivered';
    case Completed = 'completed';
    case Released = 'released';
    case Expired = 'expired';
    case Cancelled = 'cancelled';

    public function allowedTransitions(): array
    {
        return match ($this) {
            self::PendingPayment => [self::Paid, self::Expired, self::Cancelled],
            self::Paid => [self::InProgress, self::Cancelled],
            self::InProgress => [self::Delivered],
            self::Delivered => [self::Completed],
            self::Completed => [self::Released],
            self::Released, self::Expired, self::Cancelled => [],
        };
    }

    public function canTransitionTo(self $status): bool
    {
        return in_array($status, $this->allowedTransitions(), true);
    }
}
