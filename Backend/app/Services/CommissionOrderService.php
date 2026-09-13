<?php

namespace App\Services;

use App\Enums\CommissionOrderStatus;
use App\Exceptions\InvalidOrderTransitionException;
use App\Models\CommissionOrder;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class CommissionOrderService
{
    public function transition(CommissionOrder $order, CommissionOrderStatus|string $toStatus, ?User $actor = null): CommissionOrder
    {
        $targetStatus = $toStatus instanceof CommissionOrderStatus
            ? $toStatus
            : CommissionOrderStatus::from($toStatus);

        return DB::transaction(function () use ($order, $targetStatus, $actor) {
            $lockedOrder = CommissionOrder::query()
                ->whereKey($order->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($actor !== null) {
                Gate::forUser($actor)->authorize('transition', [$lockedOrder, $targetStatus]);
            } elseif ($targetStatus !== CommissionOrderStatus::Paid) {
                throw new InvalidOrderTransitionException(
                    $lockedOrder->status->value,
                    $targetStatus->value
                );
            }

            $currentStatus = $lockedOrder->status instanceof CommissionOrderStatus
                ? $lockedOrder->status
                : CommissionOrderStatus::from($lockedOrder->status);

            if (!$currentStatus->canTransitionTo($targetStatus)) {
                throw new InvalidOrderTransitionException($currentStatus->value, $targetStatus->value);
            }

            $lockedOrder->status = $targetStatus;
            $lockedOrder->save();

            OrderStatusHistory::create([
                'order_id' => $lockedOrder->id,
                'from_status' => $currentStatus->value,
                'to_status' => $targetStatus->value,
                'actor_id' => $actor?->id,
                'changed_at' => now(),
            ]);

            return $lockedOrder->fresh();
        });
    }
}
