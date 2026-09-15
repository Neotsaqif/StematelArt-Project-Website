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

    public function release(CommissionOrder $order): EscrowTransaction
    {
        return DB::transaction(function () use ($order) {
            $lockedOrder = CommissionOrder::query()
                ->whereKey($order->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedOrder->status === CommissionOrderStatus::Released) {
                $existingRelease = EscrowTransaction::query()
                    ->where('order_id', $lockedOrder->id)
                    ->where('type', EscrowTransactionType::Release->value)
                    ->first();

                if ($existingRelease) {
                    return $existingRelease;
                }
            }

            if ($lockedOrder->status !== CommissionOrderStatus::Completed) {
                throw new RuntimeException('Escrow release requires a completed order.');
            }

            $hold = EscrowTransaction::query()
                ->where('order_id', $lockedOrder->id)
                ->where('type', EscrowTransactionType::Hold->value)
                ->where('status', EscrowTransactionStatus::Held->value)
                ->first();

            if (!$hold) {
                throw new RuntimeException('Valid hold transaction not found.');
            }

            if ($hold->amount !== $lockedOrder->amount) {
                throw new RuntimeException('Hold amount mismatch with order amount.');
            }

            $existingRelease = EscrowTransaction::query()
                ->where('order_id', $lockedOrder->id)
                ->where('type', EscrowTransactionType::Release->value)
                ->first();

            if ($existingRelease) {
                return $existingRelease;
            }

            $releaseAmount = $lockedOrder->artist_payout_amount;

            $release = new EscrowTransaction();
            $release->forceFill([
                'order_id' => $lockedOrder->id,
                'type' => EscrowTransactionType::Release,
                'amount' => $releaseAmount,
                'gateway_reference_id' => $hold->gateway_reference_id,
                'status' => EscrowTransactionStatus::Released,
            ]);
            $release->save();

            $lockedOrder->status = CommissionOrderStatus::Released;
            $lockedOrder->save();

            \App\Models\OrderStatusHistory::create([
                'order_id' => $lockedOrder->id,
                'from_status' => CommissionOrderStatus::Completed->value,
                'to_status' => CommissionOrderStatus::Released->value,
                'actor_id' => null,
                'changed_at' => now(),
            ]);

            return $release;
        });
    }
}
