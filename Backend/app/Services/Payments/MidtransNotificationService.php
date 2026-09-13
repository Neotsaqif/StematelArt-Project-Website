<?php

namespace App\Services\Payments;

use App\Enums\CommissionOrderStatus;
use App\Exceptions\InvalidMidtransNotificationException;
use App\Models\CommissionOrder;
use App\Services\CommissionOrderService;
use Illuminate\Support\Facades\DB;

class MidtransNotificationService
{
    public function __construct(private CommissionOrderService $orderService)
    {
    }

    public function process(array $payload): CommissionOrder
    {
        $this->validatePayload($payload);

        $orderId = (string) $payload['order_id'];
        $statusCode = (string) $payload['status_code'];
        $grossAmount = (int) $this->normalizeAmount($payload['gross_amount']);
        $receivedSignature = (string) $payload['signature_key'];
        $expectedSignature = hash('sha512', $orderId . $statusCode . (string) $payload['gross_amount'] . config('services.midtrans.server_key'));

        if (!hash_equals($expectedSignature, $receivedSignature)) {
            throw new InvalidMidtransNotificationException('Invalid payment notification.');
        }

        return DB::transaction(function () use ($payload, $orderId, $grossAmount) {
            $order = CommissionOrder::query()
                ->where('gateway_order_id', $orderId)
                ->lockForUpdate()
                ->first();

            if (!$order) {
                throw new InvalidMidtransNotificationException('Invalid payment notification.');
            }

            if ((int) $order->amount !== $grossAmount) {
                throw new InvalidMidtransNotificationException('Invalid payment notification.');
            }

            if (!$this->isSuccessful($payload)) {
                return $order;
            }

            if ($order->status === CommissionOrderStatus::Paid) {
                return $order;
            }

            if ($order->status !== CommissionOrderStatus::PendingPayment) {
                throw new InvalidMidtransNotificationException('Invalid payment notification.');
            }

            return $this->orderService->transition($order, CommissionOrderStatus::Paid, null);
        });
    }

    private function validatePayload(array $payload): void
    {
        foreach (['order_id', 'transaction_status', 'status_code', 'gross_amount', 'signature_key'] as $field) {
            if (!array_key_exists($field, $payload) || $payload[$field] === '') {
                throw new InvalidMidtransNotificationException('Invalid payment notification.');
            }
        }

        if (!is_numeric($payload['gross_amount'])) {
            throw new InvalidMidtransNotificationException('Invalid payment notification.');
        }
    }

    private function normalizeAmount(mixed $grossAmount): int
    {
        return (int) round((float) $grossAmount);
    }

    private function isSuccessful(array $payload): bool
    {
        $status = (string) $payload['transaction_status'];

        if ($status === 'settlement') {
            return true;
        }

        if ($status !== 'capture') {
            return false;
        }

        return !array_key_exists('fraud_status', $payload)
            || $payload['fraud_status'] === 'accept';
    }
}
