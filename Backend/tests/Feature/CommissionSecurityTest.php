<?php

namespace Tests\Feature;

use App\Enums\CommissionOrderStatus;
use App\Enums\EscrowTransactionStatus;
use App\Enums\EscrowTransactionType;
use App\Models\CommissionOrder;
use App\Models\CommissionPackage;
use App\Models\EscrowTransaction;
use App\Models\OrderStatusHistory;
use App\Models\User;
use App\Services\Commission\EscrowService;
use App\Services\Payments\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class CommissionSecurityTest extends TestCase
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

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function package(User $artist, int $price = 150000, float $feeRate = 0.1): CommissionPackage
    {
        return $artist->commissionPackages()->create([
            'title' => 'Security Package',
            'description' => 'Security testing package',
            'price' => $price,
            'platform_fee_rate' => $feeRate,
            'delivery_time' => 7,
            'active' => true,
        ]);
    }

    private function order(User $buyer, User $artist, string $status = 'pending_payment'): CommissionOrder
    {
        $package = $this->package($artist);
        $order = new CommissionOrder();
        $order->package_id = $package->id;
        $order->buyer_id = $buyer->id;
        $order->artist_id = $artist->id;
        $order->amount = 150000;
        $order->platform_fee_amount = 15000;
        $order->artist_payout_amount = 135000;
        $order->brief = 'Security test brief';
        $order->status = $status;
        $order->save();

        return $order;
    }

    private function hold(CommissionOrder $order): EscrowTransaction
    {
        $hold = new EscrowTransaction();
        $hold->forceFill([
            'order_id' => $order->id,
            'type' => EscrowTransactionType::Hold,
            'amount' => $order->amount,
            'gateway_reference_id' => 'sec-tx-123',
            'status' => EscrowTransactionStatus::Held,
        ]);
        $hold->save();

        return $hold;
    }

    private function failedRelease(CommissionOrder $order, int $retryCount = 0): EscrowTransaction
    {
        $failed = new EscrowTransaction();
        $failed->forceFill([
            'order_id' => $order->id,
            'type' => EscrowTransactionType::Release,
            'amount' => $order->artist_payout_amount,
            'gateway_reference_id' => 'sec-tx-123',
            'status' => EscrowTransactionStatus::Failed,
            'failure_reason' => 'RELEASE_ATTEMPT_FAILED',
            'retry_count' => $retryCount,
            'last_attempted_at' => now(),
        ]);
        $failed->save();

        return $failed;
    }

    public function test_client_cannot_inject_financial_identity_and_status_on_order_creation(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $package = $this->package($artist, 200000, 0.1);

        $response = $this->actingAs($buyer, 'sanctum')->postJson('/api/commission/orders', [
            'package_id' => $package->id,
            'brief' => 'Tamper attempt',
            'amount' => 1,
            'platform_fee_amount' => 0,
            'artist_payout_amount' => 999999,
            'buyer_id' => 9999,
            'artist_id' => 9999,
            'status' => 'released',
            'gateway_order_id' => 'FORGED-ID',
        ])->assertCreated();

        $orderId = $response->json('data.order.id');
        $created = CommissionOrder::findOrFail($orderId);

        $this->assertSame(200000, $created->amount);
        $this->assertSame(20000, $created->platform_fee_amount);
        $this->assertSame(180000, $created->artist_payout_amount);
        $this->assertSame($buyer->id, $created->buyer_id);
        $this->assertSame($artist->id, $created->artist_id);
        $this->assertSame(CommissionOrderStatus::PendingPayment, $created->status);
    }

    public function test_forged_status_mutation_is_rejected_on_all_lifecycle_endpoints(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'pending_payment');

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/cancel", ['status' => 'paid'])
            ->assertOk();

        $this->assertSame(CommissionOrderStatus::Cancelled, $order->fresh()->status);

        $paidOrder = $this->order($buyer, $artist, 'paid');
        $this->actingAs($artist, 'sanctum')
            ->postJson("/api/commission/orders/{$paidOrder->id}/start", ['status' => 'released'])
            ->assertOk();

        $this->assertSame(CommissionOrderStatus::InProgress, $paidOrder->fresh()->status);
    }

    public function test_idor_unauthorized_users_cannot_access_orders_across_roles(): void
    {
        $buyer = $this->buyer();
        $stranger = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'pending_payment');

        $this->actingAs($stranger, 'sanctum')->getJson("/api/commission/orders/{$order->id}")->assertForbidden();
        $this->actingAs($stranger, 'sanctum')->postJson("/api/commission/orders/{$order->id}/payment")->assertForbidden();
        $this->actingAs($stranger, 'sanctum')->postJson("/api/commission/orders/{$order->id}/cancel")->assertForbidden();
        $this->actingAs($stranger, 'sanctum')->postJson("/api/commission/orders/{$order->id}/start")->assertForbidden();
        $this->actingAs($stranger, 'sanctum')->postJson("/api/commission/orders/{$order->id}/deliver")->assertForbidden();
        $this->actingAs($stranger, 'sanctum')->postJson("/api/commission/orders/{$order->id}/complete")->assertForbidden();
    }

    public function test_admin_retry_release_requires_persisted_failed_release_record(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');
        $this->hold($order);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/admin/commission/orders/{$order->id}/retry-release")
            ->assertStatus(500);

        $this->assertSame(CommissionOrderStatus::Completed, $order->fresh()->status);
        $this->assertDatabaseMissing('escrow_transactions', ['order_id' => $order->id, 'type' => 'release', 'status' => 'released']);
    }

    public function test_admin_retry_release_is_blocked_when_max_retries_reached(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');
        $this->hold($order);
        $this->failedRelease($order, 3);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/admin/commission/orders/{$order->id}/retry-release")
            ->assertStatus(500);

        $this->assertSame(CommissionOrderStatus::Completed, $order->fresh()->status);
    }

    public function test_admin_retry_release_response_is_explicitly_serialized_and_hides_secrets(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');
        $this->hold($order);
        $this->failedRelease($order, 1);

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/admin/commission/orders/{$order->id}/retry-release")
            ->assertOk();

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'order' => [
                    'id',
                    'status',
                    'amount',
                    'platform_fee_amount',
                    'artist_payout_amount',
                    'gateway_order_id',
                    'buyer',
                    'artist',
                    'package',
                ],
            ],
        ]);

        $content = $response->getContent();
        $this->assertStringNotContainsString('password', $content);
        $this->assertStringNotContainsString('remember_token', $content);
        $this->assertStringNotContainsString('server_key', $content);
    }

    public function test_payment_creation_fails_atomically_without_persisting_expiry_if_provider_throws(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'pending_payment');

        $mock = Mockery::mock(MidtransService::class);
        $mock->shouldReceive('createSnapTransaction')
            ->once()
            ->andThrow(new \App\Exceptions\PaymentProviderException('Payment provider is temporarily unavailable.'));
        $this->app->instance(MidtransService::class, $mock);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/payment")
            ->assertStatus(502);

        $this->assertNull($order->fresh()->payment_expires_at);
        $this->assertNull($order->fresh()->snap_token);
        $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
    }

    public function test_webhook_stale_notification_cannot_resurrect_cancelled_or_expired_orders(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'expired');
        $order->gateway_order_id = 'STEMATELART-COMMISSION-' . $order->id;
        $order->save();

        $payload = [
            'order_id' => $order->gateway_order_id,
            'status_code' => '200',
            'gross_amount' => '150000.00',
            'transaction_status' => 'settlement',
            'signature_key' => hash('sha512', $order->gateway_order_id . '200150000.00' . config('services.midtrans.server_key')),
            'transaction_id' => 'tx-stale-999',
        ];

        $this->postJson('/api/payments/midtrans/notification', $payload)->assertStatus(400);

        $this->assertSame(CommissionOrderStatus::Expired, $order->fresh()->status);
        $this->assertDatabaseMissing('escrow_transactions', ['order_id' => $order->id, 'type' => 'hold']);
    }

    public function test_failure_reason_is_sanitized_and_does_not_contain_stack_trace(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');
        $this->hold($order);

        $recorded = app(EscrowService::class)->recordReleaseFailure(
            $order,
            new \Exception("CRITICAL: SELECT * FROM users at /var/www/secret.php:42\nStack trace:\n#0 ...")
        );

        $this->assertSame('RELEASE_ATTEMPT_FAILED', $recorded->failure_reason);
        $this->assertStringNotContainsString('Stack trace', $recorded->failure_reason);
        $this->assertStringNotContainsString('secret.php', $recorded->failure_reason);
    }

    public function test_query_security_rejects_malicious_sort_and_sql_injection_values(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/commission/orders?sort=password')
            ->assertStatus(422);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/commission/orders?sort=amount%20desc')
            ->assertStatus(422);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/commission/orders?status=paid%27%20OR%201=1--')
            ->assertStatus(422);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/transactions?type=hold%27%20OR%201=1--')
            ->assertStatus(422);
    }

    public function test_money_invariants_hold_release_and_fee_math_are_consistent(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $package = $this->package($artist, 333333, 0.15);

        $response = $this->actingAs($buyer, 'sanctum')->postJson('/api/commission/orders', [
            'package_id' => $package->id,
            'brief' => 'Odd price testing',
        ])->assertCreated();

        $order = CommissionOrder::findOrFail($response->json('data.order.id'));

        $this->assertSame(333333, $order->amount);
        $this->assertSame(50000, $order->platform_fee_amount);
        $this->assertSame(283333, $order->artist_payout_amount);
        $this->assertSame($order->amount, $order->platform_fee_amount + $order->artist_payout_amount);
    }
}
