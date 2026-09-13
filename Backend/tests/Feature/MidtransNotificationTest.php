<?php

namespace Tests\Feature;

use App\Enums\CommissionOrderStatus;
use App\Models\CommissionOrder;
use App\Models\CommissionPackage;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use RuntimeException;
use Tests\TestCase;

class MidtransNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function buyer(): User
    {
        return User::factory()->create(['role' => 'user']);
    }

    private function artist(): User
    {
        return User::factory()->create(['role' => 'artist']);
    }

    private function order(User $buyer, User $artist, string $status = 'pending_payment'): CommissionOrder
    {
        $package = $artist->commissionPackages()->create([
            'title' => 'Webhook Package',
            'description' => 'Webhook test package',
            'price' => 150000,
            'platform_fee_rate' => 0.1,
            'delivery_time' => 7,
            'active' => true,
        ]);

        $order = new CommissionOrder();
        $order->package_id = $package->id;
        $order->buyer_id = $buyer->id;
        $order->artist_id = $artist->id;
        $order->amount = 150000;
        $order->platform_fee_amount = 15000;
        $order->artist_payout_amount = 135000;
        $order->brief = 'Webhook test';
        $order->status = $status;
        $order->save();
        $order->gateway_order_id = 'STEMATELART-COMMISSION-' . $order->id;
        $order->save();

        return $order;
    }

    private function payload(CommissionOrder $order, array $overrides = []): array
    {
        $payload = array_merge([
            'order_id' => $order->gateway_order_id,
            'transaction_status' => 'settlement',
            'status_code' => '200',
            'gross_amount' => '150000.00',
            'transaction_id' => 'tx-' . $order->id,
            'payment_type' => 'bank_transfer',
        ], $overrides);

        $payload['signature_key'] = hash('sha512',
            $payload['order_id'] .
            $payload['status_code'] .
            $payload['gross_amount'] .
            (string) config('services.midtrans.server_key')
        );

        return $payload;
    }

    public function test_valid_settlement_marks_order_paid(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $this->postJson('/api/payments/midtrans/notification', $this->payload($order))
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame(CommissionOrderStatus::Paid, $order->fresh()->status);
        $this->assertDatabaseHas('order_status_history', [
            'order_id' => $order->id,
            'from_status' => 'pending_payment',
            'to_status' => 'paid',
            'actor_id' => null,
        ]);
    }

    public function test_valid_capture_with_accept_fraud_marks_order_paid(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $this->postJson('/api/payments/midtrans/notification', $this->payload($order, [
            'transaction_status' => 'capture',
            'fraud_status' => 'accept',
        ]))->assertOk();

        $this->assertSame(CommissionOrderStatus::Paid, $order->fresh()->status);
    }

    public function test_invalid_or_missing_signature_is_rejected(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $invalidSignature = $this->payload($order);
        $invalidSignature['signature_key'] = 'invalid';
        $this->postJson('/api/payments/midtrans/notification', $invalidSignature)->assertBadRequest();

        $payload = $this->payload($order);
        unset($payload['signature_key']);
        $this->postJson('/api/payments/midtrans/notification', $payload)->assertBadRequest();

        $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
        $this->assertDatabaseCount('order_status_history', 0);
    }

    public function test_amount_mismatch_and_unknown_order_are_rejected(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $this->postJson('/api/payments/midtrans/notification', $this->payload($order, [
            'gross_amount' => '1.00',
        ]))->assertBadRequest();

        $unknown = $this->payload($order, ['order_id' => 'STEMATELART-COMMISSION-unknown']);
        $unknown['signature_key'] = hash('sha512', $unknown['order_id'] . $unknown['status_code'] . $unknown['gross_amount'] . (string) config('services.midtrans.server_key'));
        $this->postJson('/api/payments/midtrans/notification', $unknown)->assertBadRequest();

        $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
    }

    public function test_malformed_payload_is_rejected(): void
    {
        foreach ([[], ['order_id' => 'x'], ['order_id' => 'x', 'transaction_status' => 'settlement', 'status_code' => '200', 'gross_amount' => '150000.00']] as $payload) {
            $this->postJson('/api/payments/midtrans/notification', $payload)->assertBadRequest();
        }
    }

    public function test_non_success_statuses_do_not_mark_paid(): void
    {
        foreach (['pending', 'deny', 'cancel', 'expire', 'failure'] as $status) {
            $order = $this->order($this->buyer(), $this->artist());
            $this->postJson('/api/payments/midtrans/notification', $this->payload($order, [
                'transaction_status' => $status,
            ]))->assertOk();

            $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
        }
    }

    public function test_denied_capture_does_not_mark_paid(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $this->postJson('/api/payments/midtrans/notification', $this->payload($order, [
            'transaction_status' => 'capture',
            'fraud_status' => 'deny',
        ]))->assertOk();

        $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
    }

    public function test_duplicate_settlement_is_idempotent_and_paid_does_not_regress(): void
    {
        $order = $this->order($this->buyer(), $this->artist());
        $payload = $this->payload($order);

        $this->postJson('/api/payments/midtrans/notification', $payload)->assertOk();
        $this->postJson('/api/payments/midtrans/notification', $payload)->assertOk();
        $this->postJson('/api/payments/midtrans/notification', $this->payload($order, [
            'transaction_status' => 'pending',
        ]))->assertOk();

        $this->assertSame(CommissionOrderStatus::Paid, $order->fresh()->status);
        $this->assertDatabaseCount('order_status_history', 1);
    }

    public function test_paid_order_does_not_accept_non_success_regression(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'paid');

        $this->postJson('/api/payments/midtrans/notification', $this->payload($order, [
            'transaction_status' => 'pending',
        ]))->assertOk();

        $this->assertSame(CommissionOrderStatus::Paid, $order->fresh()->status);
        $this->assertDatabaseCount('order_status_history', 0);
    }

    public function test_webhook_route_does_not_require_sanctum(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $this->postJson('/api/payments/midtrans/notification', $this->payload($order))
            ->assertOk();
    }

    public function test_history_failure_rolls_back_status_and_history(): void
    {
        $order = $this->order($this->buyer(), $this->artist());
        Event::listen('eloquent.creating: ' . OrderStatusHistory::class, function () {
            throw new RuntimeException('history failure');
        });

        try {
            $this->postJson('/api/payments/midtrans/notification', $this->payload($order))->assertStatus(500);
        } finally {
            Event::forget('eloquent.creating: ' . OrderStatusHistory::class);
        }

        $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
        $this->assertDatabaseCount('order_status_history', 0);
    }
}
