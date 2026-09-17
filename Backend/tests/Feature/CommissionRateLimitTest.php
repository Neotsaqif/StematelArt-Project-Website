<?php

namespace Tests\Feature;

use App\Enums\EscrowTransactionStatus;
use App\Enums\EscrowTransactionType;
use App\Models\CommissionOrder;
use App\Models\CommissionPackage;
use App\Models\EscrowTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommissionRateLimitTest extends TestCase
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

    private function order(User $buyer, User $artist, string $status = 'pending_payment'): CommissionOrder
    {
        $package = $artist->commissionPackages()->create([
            'title' => 'Rate Limit Package',
            'description' => 'Rate limit testing package',
            'price' => 100000,
            'platform_fee_rate' => 0.1,
            'delivery_time' => 7,
            'active' => true,
        ]);

        $order = new CommissionOrder();
        $order->package_id = $package->id;
        $order->buyer_id = $buyer->id;
        $order->artist_id = $artist->id;
        $order->amount = 100000;
        $order->platform_fee_amount = 10000;
        $order->artist_payout_amount = 90000;
        $order->brief = 'Rate limit test';
        $order->status = $status;
        $order->save();

        return $order;
    }

    public function test_payment_creation_is_rate_limited(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'pending_payment');

        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($buyer, 'sanctum')->postJson("/api/commission/orders/{$order->id}/payment");
        }

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/payment")
            ->assertStatus(429);
    }

    public function test_completion_is_rate_limited(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');

        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($buyer, 'sanctum')->postJson("/api/commission/orders/{$order->id}/complete");
        }

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertStatus(429);
    }

    public function test_cancellation_is_rate_limited(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'pending_payment');

        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($buyer, 'sanctum')->postJson("/api/commission/orders/{$order->id}/cancel");
        }

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/cancel")
            ->assertStatus(429);
    }

    public function test_admin_retry_release_is_rate_limited(): void
    {
        $admin = $this->admin();
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');

        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($admin, 'sanctum')->postJson("/api/admin/commission/orders/{$order->id}/retry-release");
        }

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/commission/orders/{$order->id}/retry-release")
            ->assertStatus(429);
    }

    public function test_webhook_notification_is_rate_limited(): void
    {
        for ($i = 0; $i < 120; $i++) {
            $this->postJson('/api/payments/midtrans/notification', []);
        }

        $this->postJson('/api/payments/midtrans/notification', [])
            ->assertStatus(429);
    }
}
