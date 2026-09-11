<?php

namespace App\Services\Payments;

use App\Exceptions\InvalidPaymentStateException;
use App\Exceptions\PaymentProviderException;
use App\Models\CommissionOrder;
use App\Enums\CommissionOrderStatus;
use Midtrans\Config;
use Midtrans\Snap;
use Throwable;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = (string) config('services.midtrans.server_key');
        Config::$clientKey = (string) config('services.midtrans.client_key');
        Config::$isProduction = (bool) config('services.midtrans.is_production');
    }

    public function createSnapTransaction(CommissionOrder $order): array
    {
        if ($order->status !== CommissionOrderStatus::PendingPayment) {
            throw new InvalidPaymentStateException('Payment is not available for this order.');
        }

        $gatewayOrderId = $order->gateway_order_id ?: $this->gatewayOrderId($order);

        try {
            $response = Snap::createTransaction($this->payload($order, $gatewayOrderId));
        } catch (Throwable $exception) {
            throw new PaymentProviderException('Payment provider is temporarily unavailable.', 0, $exception);
        }

        $snapToken = is_object($response)
            ? ($response->token ?? null)
            : ($response['token'] ?? null);
        $redirectUrl = is_object($response)
            ? ($response->redirect_url ?? null)
            : ($response['redirect_url'] ?? null);

        if (!$snapToken) {
            throw new PaymentProviderException('Payment provider is temporarily unavailable.');
        }

        return [
            'gateway_order_id' => $gatewayOrderId,
            'snap_token' => $snapToken,
            'redirect_url' => $redirectUrl,
        ];
    }

    public function gatewayOrderId(CommissionOrder $order): string
    {
        return 'STEMATELART-COMMISSION-' . $order->id;
    }

    public function payload(CommissionOrder $order, string $gatewayOrderId): array
    {
        $order->loadMissing(['package', 'buyer']);

        return [
            'transaction_details' => [
                'order_id' => $gatewayOrderId,
                'gross_amount' => (int) $order->amount,
            ],
            'item_details' => [
                [
                    'id' => 'commission-package-' . $order->package_id,
                    'price' => (int) $order->amount,
                    'quantity' => 1,
                    'name' => $order->package->title,
                ],
            ],
            'customer_details' => [
                'first_name' => $order->buyer->name,
                'email' => $order->buyer->email,
            ],
        ];
    }
}
