<?php

namespace Tests\Feature;

use App\Enums\CommissionOrderStatus;
use App\Models\CommissionOrder;
use App\Models\CommissionPackage;
use App\Models\User;
use App\Services\CommissionOrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use RuntimeException;
use Tests\TestCase;

class OrderExpiryTest extends TestCase
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

    private function package(User $artist): CommissionPackage
    {
        return $artist->commissionPackages()->create([
            'title' => 'Expiry Package',
            'description' => 'Test package for expiry',
            'price' => 150000,
            'platform_fee_rate' => 0.1,
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
        $order->brief = 'Expiry test order';
        $order->status = $status;
        $order->save();

        return $order;
    }

    public function test_pending_order_expires_via_command(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'pending_payment');
        $order->created_at = now()->subHours(25);
        $order->save();

        Artisan::call('commission:expire-pending-payments');

        $this->assertSame(CommissionOrderStatus::Expired, $order->fresh()->status);
        $this->assertNotNull($order->fresh()->expired_at);
    }

    public function test_non_pending_order_remains_unchanged_on_expiry(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'paid');
        $order->created_at = now()->subHours(25);
        $order->save();

        Artisan::call('commission:expire-pending-payments');

        $this->assertSame(CommissionOrderStatus::Paid, $order->fresh()->status);
        $this->assertNull($order->fresh()->expired_at);
    }

    public function test_repeated_expiry_is_idempotent(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'pending_payment');
        $order->created_at = now()->subHours(25);
        $order->save();

        Artisan::call('commission:expire-pending-payments');
        $firstExpiredAt = $order->fresh()->expired_at;

        Artisan::call('commission:expire-pending-payments');
        $this->assertSame(CommissionOrderStatus::Expired, $order->fresh()->status);
        $this->assertEquals($firstExpiredAt, $order->fresh()->expired_at);
    }

    public function test_expired_order_cannot_pay(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'expired');

        $this->actingAs($order->buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/payment")
            ->assertStatus(409);
    }

    public function test_expired_order_cannot_start(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'expired');

        $this->actingAs($order->artist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/start")
            ->assertStatus(409);
    }

    public function test_expired_order_cannot_deliver(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'expired');

        $this->actingAs($order->artist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/deliver")
            ->assertStatus(409);
    }

    public function test_expired_order_cannot_complete(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'expired');

        $this->actingAs($order->buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertStatus(409);
    }

    public function test_expiration_history_created_once_with_null_actor(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'pending_payment');
        $order->created_at = now()->subHours(25);
        $order->save();

        Artisan::call('commission:expire-pending-payments');

        $this->assertDatabaseHas('order_status_history', [
            'order_id' => $order->id,
            'from_status' => 'pending_payment',
            'to_status' => 'expired',
            'actor_id' => null,
        ]);
    }

    public function test_buyer_can_cancel_pending_order(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'pending_payment');

        $this->actingAs($order->buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.order.status', 'cancelled');

        $this->assertNotNull($order->fresh()->cancelled_at);
    }

    public function test_unrelated_buyer_cannot_cancel(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'pending_payment');
        $otherBuyer = $this->buyer();

        $this->actingAs($otherBuyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/cancel")
            ->assertForbidden();

        $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
    }

    public function test_artist_cannot_cancel(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'pending_payment');

        $this->actingAs($order->artist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/cancel")
            ->assertForbidden();

        $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
    }

    public function test_unauthenticated_cannot_cancel(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'pending_payment');

        $this->postJson("/api/commission/orders/{$order->id}/cancel")
            ->assertStatus(401);

        $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
    }

    public function test_paid_order_cannot_be_cancelled(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'paid');

        $this->actingAs($order->buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/cancel")
            ->assertStatus(500);

        $this->assertSame(CommissionOrderStatus::Paid, $order->fresh()->status);
    }

    public function test_in_progress_cannot_be_cancelled(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'in_progress');

        $this->actingAs($order->buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/cancel")
            ->assertStatus(500);

        $this->assertSame(CommissionOrderStatus::InProgress, $order->fresh()->status);
    }

    public function test_duplicate_cancel_is_safe(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'pending_payment');

        $this->actingAs($order->buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/cancel")
            ->assertOk();

        $this->actingAs($order->buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/cancel")
            ->assertOk();

        $this->assertDatabaseCount('order_status_history', 1);
    }

    public function test_cancellation_history_created_with_buyer_actor(): void
    {
        $order = $this->order($this->buyer(), $this->artist(), 'pending_payment');

        $this->actingAs($order->buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/cancel")
            ->assertOk();

        $this->assertDatabaseHas('order_status_history', [
            'order_id' => $order->id,
            'from_status' => 'pending_payment',
            'to_status' => 'cancelled',
            'actor_id' => $order->buyer->id,
        ]);
    }
}
