<?php

namespace App\Services;

use App\Enums\CommissionOrderStatus;
use App\Exceptions\InvalidOrderTransitionException;
use App\Models\CommissionOrder;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use RuntimeException;

class CommissionOrderService
{
    public function cancel(CommissionOrder $order, User $actor): CommissionOrder
    {
        return DB::transaction(function () use ($order, $actor) {
            $lockedOrder = CommissionOrder::query()
                ->whereKey($order->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedOrder->status === CommissionOrderStatus::Cancelled) {
                return $lockedOrder;
            }

            if ($lockedOrder->status !== CommissionOrderStatus::PendingPayment) {
                throw new RuntimeException('Only pending_payment orders can be cancelled.');
            }

            $cancelledOrder = $this->transition($lockedOrder, CommissionOrderStatus::Cancelled, $actor);

            $cancelledOrder->cancelled_at = now();
            $cancelledOrder->save();

            return $cancelledOrder;
        });
    }

    public function expire(CommissionOrder $order): CommissionOrder
    {
        return DB::transaction(function () use ($order) {
            $lockedOrder = CommissionOrder::query()
                ->whereKey($order->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedOrder->status === CommissionOrderStatus::Expired) {
                return $lockedOrder;
            }

            if ($lockedOrder->status !== CommissionOrderStatus::PendingPayment) {
                throw new RuntimeException('Only pending_payment orders can be expired.');
            }

            $expiredOrder = $this->transition($lockedOrder, CommissionOrderStatus::Expired, null);

            $expiredOrder->expired_at = now();
            $expiredOrder->save();

            return $expiredOrder;
        });
    }

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
            } elseif (!in_array($targetStatus, [CommissionOrderStatus::Paid, CommissionOrderStatus::Expired], true)) {
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
