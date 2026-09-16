<?php

namespace App\Services\Commission;

use App\Enums\CommissionOrderStatus;
use App\Enums\EscrowTransactionStatus;
use App\Enums\EscrowTransactionType;
use App\Models\CommissionOrder;
use App\Models\EscrowTransaction;
use App\Models\OrderStatusHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

            OrderStatusHistory::create([
                'order_id' => $lockedOrder->id,
                'from_status' => CommissionOrderStatus::Completed->value,
                'to_status' => CommissionOrderStatus::Released->value,
                'actor_id' => null,
                'changed_at' => now(),
            ]);

            return $release;
        });
    }

    public function retryRelease(CommissionOrder $order, ?string $failureReason = null): EscrowTransaction
    {
        return DB::transaction(function () use ($order, $failureReason) {
            $lockedOrder = CommissionOrder::query()
                ->whereKey($order->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedOrder->status !== CommissionOrderStatus::Completed) {
                throw new RuntimeException('Retry release requires order to be completed.');
            }

            $hold = EscrowTransaction::query()
                ->where('order_id', $lockedOrder->id)
                ->where('type', EscrowTransactionType::Hold->value)
                ->where('status', EscrowTransactionStatus::Held->value)
                ->first();

            if (!$hold) {
                throw new RuntimeException('Valid hold transaction not found.');
            }

            $existingRelease = EscrowTransaction::query()
                ->where('order_id', $lockedOrder->id)
                ->where('type', EscrowTransactionType::Release->value)
                ->where('status', EscrowTransactionStatus::Released->value)
                ->first();

            if ($existingRelease) {
                return $existingRelease;
            }

            $previousFailure = EscrowTransaction::query()
                ->where('order_id', $lockedOrder->id)
                ->where('type', EscrowTransactionType::Release->value)
                ->where('status', EscrowTransactionStatus::Failed->value)
                ->first();

            $maxRetries = (int) config('services.commission.release_max_retries', 3);

            if ($previousFailure && $previousFailure->retry_count >= $maxRetries) {
                throw new RuntimeException('Maximum retry attempts reached.');
            }

            try {
                $releaseAmount = $lockedOrder->artist_payout_amount;

                $release = $previousFailure ?: new EscrowTransaction();
                $release->forceFill([
                    'order_id' => $lockedOrder->id,
                    'type' => EscrowTransactionType::Release,
                    'amount' => $releaseAmount,
                    'gateway_reference_id' => $hold->gateway_reference_id,
                    'status' => EscrowTransactionStatus::Released,
                    'failure_reason' => null,
                    'last_attempted_at' => now(),
                ]);
                $release->save();

                $lockedOrder->status = CommissionOrderStatus::Released;
                $lockedOrder->save();

                OrderStatusHistory::create([
                    'order_id' => $lockedOrder->id,
                    'from_status' => CommissionOrderStatus::Completed->value,
                    'to_status' => CommissionOrderStatus::Released->value,
                    'actor_id' => null,
                    'changed_at' => now(),
                ]);

                return $release;
            } catch (\Throwable $e) {
                if ($previousFailure) {
                    $previousFailure->retry_count = $previousFailure->retry_count + 1;
                    $previousFailure->failure_reason = $failureReason ?? $e->getMessage();
                    $previousFailure->last_attempted_at = now();
                    $previousFailure->save();
                } else {
                    $failedRelease = new EscrowTransaction();
                    $failedRelease->forceFill([
                        'order_id' => $lockedOrder->id,
                        'type' => EscrowTransactionType::Release,
                        'amount' => $lockedOrder->artist_payout_amount,
                        'gateway_reference_id' => $hold->gateway_reference_id,
                        'status' => EscrowTransactionStatus::Failed,
                        'failure_reason' => $failureReason ?? $e->getMessage(),
                        'retry_count' => 1,
                        'last_attempted_at' => now(),
                    ]);
                    $failedRelease->save();
                }

                Log::error('Commission escrow release retry failed.', [
                    'order_id' => $lockedOrder->id,
                    'retry_count' => $previousFailure ? $previousFailure->retry_count + 1 : 1,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);

                return $previousFailure ?: $failedRelease;
            }
        });
    }

    public function recordReleaseFailure(CommissionOrder $order, \Throwable $exception): EscrowTransaction
    {
        return DB::transaction(function () use ($order, $exception) {
            $lockedOrder = CommissionOrder::query()
                ->whereKey($order->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $hold = EscrowTransaction::query()
                ->where('order_id', $lockedOrder->id)
                ->where('type', EscrowTransactionType::Hold->value)
                ->where('status', EscrowTransactionStatus::Held->value)
                ->first();

            if (!$hold) {
                throw $exception;
            }

            $failure = EscrowTransaction::query()
                ->where('order_id', $lockedOrder->id)
                ->where('type', EscrowTransactionType::Release->value)
                ->where('status', EscrowTransactionStatus::Failed->value)
                ->first();

            if (!$failure) {
                $failure = new EscrowTransaction();
                $failure->forceFill([
                    'order_id' => $lockedOrder->id,
                    'type' => EscrowTransactionType::Release,
                    'amount' => $lockedOrder->artist_payout_amount,
                    'gateway_reference_id' => $hold->gateway_reference_id,
                    'status' => EscrowTransactionStatus::Failed,
                    'failure_reason' => $exception->getMessage(),
                    'retry_count' => 0,
                    'last_attempted_at' => now(),
                ]);
            } else {
                $failure->failure_reason = $exception->getMessage();
                $failure->last_attempted_at = now();
            }

            try {
                $failure->save();
            } catch (\Throwable $saveException) {
                Log::error('Could not persist release failure transaction.', [
                    'order_id' => $lockedOrder->id,
                    'exception' => $saveException::class,
                ]);
            }

            return $failure;
        });
    }
}
