<?php

namespace App\Services\Commission;

use App\Enums\CommissionOrderStatus;
use App\Enums\EscrowTransactionStatus;
use App\Enums\EscrowTransactionType;
use App\Models\CommissionOrder;
use App\Models\EscrowTransaction;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class EscrowService
{
    public function createHold(CommissionOrder $order, ?string $gatewayReferenceId = null): EscrowTransaction
    {
        return DB::transaction(function () use ($order, $gatewayReferenceId) {
            $lockedOrder = CommissionOrder::query()
                ->whereKey($order->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedOrder->status !== CommissionOrderStatus::Paid) {
                throw new RuntimeException('Escrow hold requires a paid order.');
            }

            $existingHold = EscrowTransaction::query()
                ->where('order_id', $lockedOrder->id)
                ->where('type', EscrowTransactionType::Hold->value)
                ->first();

            if ($existingHold) {
                return $existingHold;
            }

            if ($lockedOrder->amount < 0) {
                throw new RuntimeException('Escrow hold amount is invalid.');
            }

            $hold = new EscrowTransaction();
            $hold->forceFill([
                'order_id' => $lockedOrder->id,
                'type' => EscrowTransactionType::Hold,
                'amount' => $lockedOrder->amount,
                'gateway_reference_id' => $gatewayReferenceId,
                'status' => EscrowTransactionStatus::Held,
            ]);
            $hold->save();

            return $hold;
        });
    }
}
