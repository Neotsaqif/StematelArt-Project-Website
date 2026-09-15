<?php

namespace Tests\Feature;

use App\Enums\CommissionOrderStatus;
use App\Enums\EscrowTransactionStatus;
use App\Enums\EscrowTransactionType;
use App\Models\CommissionOrder;
use App\Models\CommissionPackage;
use App\Models\EscrowTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminEscrowTest extends TestCase
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

    private function package(User $artist): CommissionPackage
    {
        return $artist->commissionPackages()->create([
            'title' => 'Admin Test Package',
            'description' => 'Test package for admin testing',
            'price' => 150000,
            'platform_fee_rate' => 0.1,
            'delivery_time' => 7,
            'active' => true,
        ]);
    }

    private function order(User $buyer, User $artist, string $status = 'paid'): CommissionOrder
    {
        $package = $this->package($artist);
        $order = new CommissionOrder();
        $order->package_id = $package->id;
        $order->buyer_id = $buyer->id;
        $order->artist_id = $artist->id;
        $order->amount = 150000;
        $order->platform_fee_amount = 15000;
        $order->artist_payout_amount = 135000;
        $order->brief = 'Admin test order';
        $order->status = $status;
        $order->save();

        return $order;
    }

    private function createHold(CommissionOrder $order): EscrowTransaction
    {
        $hold = new EscrowTransaction();
        $hold->forceFill([
            'order_id' => $order->id,
            'type' => EscrowTransactionType::Hold,
            'amount' => $order->amount,
            'gateway_reference_id' => 'test-tx-ref',
            'status' => EscrowTransactionStatus::Held,
        ]);
        $hold->save();

        return $hold;
    }

    private function createRelease(CommissionOrder $order): EscrowTransaction
    {
        $release = new EscrowTransaction();
        $release->forceFill([
            'order_id' => $order->id,
            'type' => EscrowTransactionType::Release,
            'amount' => $order->artist_payout_amount,
            'gateway_reference_id' => 'test-tx-ref',
            'status' => EscrowTransactionStatus::Released,
        ]);
        $release->save();

        return $release;
    }

    // AUTHORIZATION (7 tests)
    public function test_unauthenticated_cannot_access_admin_orders(): void
    {
        $this->getJson('/api/admin/commission/orders')->assertStatus(401);
    }

    public function test_user_cannot_access_admin_orders(): void
    {
        $this->actingAs($this->buyer(), 'sanctum')
            ->getJson('/api/admin/commission/orders')
            ->assertStatus(403);
    }

    public function test_artist_cannot_access_admin_orders(): void
    {
        $this->actingAs($this->artist(), 'sanctum')
            ->getJson('/api/admin/commission/orders')
            ->assertStatus(403);
    }

    public function test_admin_can_access_order_list(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/commission/orders')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['orders']]);
    }

    public function test_admin_can_access_order_detail(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order.id', $order->id);
    }

    public function test_admin_can_access_escrow_ledger(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/transactions')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['transactions']]);
    }

    public function test_admin_can_access_failed_endpoint(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/failed')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['failed_states']]);
    }

    // ORDER LIST (8 tests)
    public function test_order_list_is_paginated(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/commission/orders?per_page=5')
            ->assertOk()
            ->assertJsonPath('data.orders.per_page', 5);
    }

    public function test_maximum_per_page_is_enforced(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/commission/orders?per_page=100')
            ->assertStatus(422);
    }

    public function test_status_filter_works(): void
    {
        $order1 = $this->order($this->buyer(), $this->artist(), 'paid');
        $order2 = $this->order($this->buyer(), $this->artist(), 'delivered');

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/commission/orders?status=paid')
            ->assertOk()
            ->assertJsonCount(1, 'data.orders.data')
            ->assertJsonPath('data.orders.data.0.status', 'paid');
    }

    public function test_buyer_id_filter_works(): void
    {
        $buyer1 = $this->buyer();
        $buyer2 = $this->buyer();
        $artist = $this->artist();
        $order1 = $this->order($buyer1, $artist);
        $order2 = $this->order($buyer2, $artist);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders?buyer_id={$buyer1->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.orders.data')
            ->assertJsonPath('data.orders.data.0.buyer_id', $buyer1->id);
    }

    public function test_artist_id_filter_works(): void
    {
        $buyer = $this->buyer();
        $artist1 = $this->artist();
        $artist2 = $this->artist();
        $order1 = $this->order($buyer, $artist1);
        $order2 = $this->order($buyer, $artist2);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders?artist_id={$artist1->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.orders.data')
            ->assertJsonPath('data.orders.data.0.artist_id', $artist1->id);
    }

    public function test_invalid_status_filter_rejected(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/commission/orders?status=not_a_real_status')
            ->assertStatus(422);
    }

    public function test_sorting_by_amount_works(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        
        $package1 = $artist->commissionPackages()->create(['title' => 'P1', 'price' => 100000, 'platform_fee_rate' => 0.1, 'delivery_time' => 5, 'active' => true]);
        $order1 = new CommissionOrder(['package_id' => $package1->id, 'brief' => 'B1']);
        $order1->buyer_id = $buyer->id; $order1->artist_id = $artist->id; $order1->amount = 100000;
        $order1->platform_fee_amount = 10000; $order1->artist_payout_amount = 90000; $order1->status = 'paid'; $order1->save();

        $package2 = $artist->commissionPackages()->create(['title' => 'P2', 'price' => 200000, 'platform_fee_rate' => 0.1, 'delivery_time' => 5, 'active' => true]);
        $order2 = new CommissionOrder(['package_id' => $package2->id, 'brief' => 'B2']);
        $order2->buyer_id = $buyer->id; $order2->artist_id = $artist->id; $order2->amount = 200000;
        $order2->platform_fee_amount = 20000; $order2->artist_payout_amount = 180000; $order2->status = 'paid'; $order2->save();

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/commission/orders?sort=amount&direction=asc')
            ->assertOk()
            ->assertJsonPath('data.orders.data.0.amount', 100000)
            ->assertJsonPath('data.orders.data.1.amount', 200000);
    }

    public function test_invalid_sort_rejected(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/commission/orders?sort=password')
            ->assertStatus(422);
    }

    // ORDER DETAIL (6 tests)
    public function test_order_detail_contains_buyer_artist_package(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders/{$order->id}")
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'order' => [
                        'buyer' => ['id', 'name', 'email'],
                        'artist' => ['id', 'name', 'email'],
                        'package' => ['id', 'title', 'price'],
                    ]
                ]
            ]);
    }

    public function test_order_detail_contains_payment_reference(): void
    {
        $order = $this->order($this->buyer(), $this->artist());
        $order->gateway_order_id = 'MIDTRANS-123';
        $order->save();

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.order.gateway_order_id', 'MIDTRANS-123');
    }

    public function test_order_detail_contains_escrow_transactions(): void
    {
        $order = $this->order($this->buyer(), $this->artist());
        $this->createHold($order);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders/{$order->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.order.escrow_transactions');
    }

    public function test_order_detail_contains_status_history(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders/{$order->id}")
            ->assertOk()
            ->assertJsonStructure(['data' => ['order' => ['status_history']]]);
    }

    public function test_escrow_consistency_shows_valid_when_hold_exists_for_paid(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'paid');
        $this->createHold($order);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.order.escrow_consistency.valid', true)
            ->assertJsonCount(0, 'data.order.escrow_consistency.issues');
    }

    public function test_escrow_consistency_shows_invalid_when_paid_without_hold(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'paid');

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.order.escrow_consistency.valid', false)
            ->assertJsonPath('data.order.escrow_consistency.issues.0', 'Order is paid but has no valid escrow hold.');
    }

    // ESCROW LEDGER (6 tests)
    public function test_escrow_ledger_returns_hold_transaction(): void
    {
        $order = $this->order($this->buyer(), $this->artist());
        $this->createHold($order);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/transactions')
            ->assertOk()
            ->assertJsonCount(1, 'data.transactions.data')
            ->assertJsonPath('data.transactions.data.0.type', 'hold');
    }

    public function test_escrow_ledger_returns_release_transaction(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'released');
        $this->createRelease($order);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/transactions')
            ->assertOk()
            ->assertJsonCount(1, 'data.transactions.data')
            ->assertJsonPath('data.transactions.data.0.type', 'release');
    }

    public function test_escrow_type_filter_works(): void
    {
        $order = $this->order($this->buyer(), $this->artist());
        $this->createHold($order);
        $this->createRelease($order);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/transactions?type=hold')
            ->assertOk()
            ->assertJsonCount(1, 'data.transactions.data')
            ->assertJsonPath('data.transactions.data.0.type', 'hold');
    }

    public function test_escrow_status_filter_works(): void
    {
        $order = $this->order($this->buyer(), $this->artist());
        $this->createHold($order);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/transactions?status=held')
            ->assertOk()
            ->assertJsonCount(1, 'data.transactions.data')
            ->assertJsonPath('data.transactions.data.0.status', 'held');
    }

    public function test_escrow_order_id_filter_works(): void
    {
        $order1 = $this->order($this->buyer(), $this->artist());
        $order2 = $this->order($this->buyer(), $this->artist());
        $this->createHold($order1);
        $this->createHold($order2);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/escrow/transactions?order_id={$order1->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.transactions.data')
            ->assertJsonPath('data.transactions.data.0.order_id', $order1->id);
    }

    public function test_escrow_transaction_contains_order_summary(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist);
        $this->createHold($order);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/transactions')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'transactions' => [
                        'data' => [
                            '*' => [
                                'id',
                                'order' => [
                                    'id',
                                    'status',
                                    'buyer' => ['id', 'name'],
                                    'artist' => ['id', 'name'],
                                ]
                            ]
                        ]
                    ]
                ]
            ]);
    }

    // FAILED ENDPOINT (3 tests)
    public function test_paid_without_hold_detected_in_failed_endpoint(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'paid');

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/failed')
            ->assertOk()
            ->assertJsonCount(1, 'data.failed_states.data')
            ->assertJsonPath('data.failed_states.data.0.issue', 'missing_hold')
            ->assertJsonPath('data.failed_states.data.0.order_id', $order->id);
    }

    public function test_released_without_release_detected_in_failed_endpoint(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'released');

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/failed')
            ->assertOk()
            ->assertJsonCount(1, 'data.failed_states.data')
            ->assertJsonPath('data.failed_states.data.0.issue', 'missing_release')
            ->assertJsonPath('data.failed_states.data.0.order_id', $order->id);
    }

    public function test_failed_endpoint_returns_empty_when_no_inconsistencies(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'paid');
        $this->createHold($order);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/failed')
            ->assertOk()
            ->assertJsonCount(0, 'data.failed_states.data');
    }

    // SECURITY (5 tests)
    public function test_password_not_in_admin_response(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders/{$order->id}")
            ->assertOk();

        $this->assertStringNotContainsString('password', $response->getContent());
    }

    public function test_remember_token_not_in_admin_response(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders/{$order->id}")
            ->assertOk();

        $this->assertStringNotContainsString('remember_token', $response->getContent());
    }

    public function test_server_key_not_in_admin_response(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/admin/commission/orders/{$order->id}")
            ->assertOk();

        $this->assertStringNotContainsString('server_key', $response->getContent());
        $this->assertStringNotContainsString('SB-Mid-server', $response->getContent());
    }

    public function test_admin_endpoints_are_read_only(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'paid');
        $this->createHold($order);

        $initialOrderCount = CommissionOrder::count();
        $initialEscrowTxCount = EscrowTransaction::count();

        $this->actingAs($this->admin(), 'sanctum')->getJson('/api/admin/commission/orders');
        $this->actingAs($this->admin(), 'sanctum')->getJson("/api/admin/commission/orders/{$order->id}");
        $this->actingAs($this->admin(), 'sanctum')->getJson('/api/admin/escrow/transactions');
        $this->actingAs($this->admin(), 'sanctum')->getJson('/api/admin/escrow/failed');

        $this->assertSame($initialOrderCount, CommissionOrder::count());
        $this->assertSame($initialEscrowTxCount, EscrowTransaction::count());
    }
}
