<?php

namespace App\Console\Commands;

use App\Enums\CommissionOrderStatus;
use App\Models\CommissionOrder;
use App\Services\CommissionOrderService;
use Illuminate\Console\Command;

class ExpirePendingPayments extends Command
{
    protected $signature = 'commission:expire-pending-payments';

    protected $description = 'Expire commission orders that exceeded the payment window';

    public function handle(CommissionOrderService $service): int
    {
        $expiresBefore = now()->subMinutes((int) config('services.commission.payment_expiry_minutes', 1440));

        CommissionOrder::query()
            ->where('status', CommissionOrderStatus::PendingPayment->value)
            ->where(function ($query) use ($expiresBefore) {
                $query->where('payment_expires_at', '<=', now())
                    ->orWhere(function ($query) use ($expiresBefore) {
                        $query->whereNull('payment_expires_at')
                            ->where('created_at', '<=', $expiresBefore);
                    });
            })
            ->pluck('id')
            ->each(function (int $orderId) use ($service): void {
                try {
                    $service->expire(CommissionOrder::findOrFail($orderId));
                } catch (\Throwable $exception) {
                    $this->warn("Could not expire commission order {$orderId}: {$exception->getMessage()}");
                }
            });

        return self::SUCCESS;
    }
}
