<?php

namespace Tests\Feature;

use App\Enums\CommissionOrderStatus;
use App\Enums\EscrowTransactionStatus;
use App\Enums\EscrowTransactionType;
use App\Models\CommissionOrder;
use App\Models\CommissionPackage;
use App\Models\EscrowTransaction;
use App\Models\User;
use App\Services\Commission\EscrowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use RuntimeException;
use Tests\TestCase;

class EscrowRecoveryTest extends TestCase
{
    use RefreshDatabase;

    private function buyer(): User { return User::factory()->create(['role' => 'user']); }
    private function artist(): User { return User::factory()->create(['role' => 'artist']); }
    private function admin(): User { return User::factory()->create(['role' => 'admin']); }

    private function order(string $status = 'completed'): CommissionOrder
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $package = $artist->commissionPackages()->create([
            'title' => 'Recovery Package', 'description' => 'Recovery test',
            'price' => 150000, 'platform_fee_rate' => 0.1, 'delivery_time' => 7, 'active' => true,
        ]);
        $order = new CommissionOrder();
        $order->package_id = $package->id; $order->buyer_id = $buyer->id; $order->artist_id = $artist->id;
        $order->amount = 150000; $order->platform_fee_amount = 15000; $order->artist_payout_amount = 135000;
        $order->brief = 'Recovery test'; $order->status = $status; $order->save();
        return $order;
    }

    private function hold(CommissionOrder $order): EscrowTransaction
    {
        $hold = new EscrowTransaction();
        $hold->forceFill([
            'order_id' => $order->id, 'type' => EscrowTransactionType::Hold,
            'amount' => $order->amount, 'gateway_reference_id' => 'recovery-ref',
            'status' => EscrowTransactionStatus::Held,
        ]);
        $hold->save(); return $hold;
    }

    public function test_release_failure_is_persisted_and_order_remains_completed(): void
    {
        $order = $this->order(); $hold = $this->hold($order);
        Event::listen('eloquent.creating: ' . EscrowTransaction::class, function ($transaction) {
            if ($transaction->type === EscrowTransactionType::Release) throw new RuntimeException('provider failed');
        });
        try {
            $this->expectException(RuntimeException::class);
            app(EscrowService::class)->retryRelease($order);
        } finally { Event::forget('eloquent.creating: ' . EscrowTransaction::class); }

        $this->assertSame(CommissionOrderStatus::Completed, $order->fresh()->status);
        $this->assertDatabaseHas('escrow_transactions', [
            'order_id' => $order->id, 'type' => 'release', 'status' => 'failed', 'retry_count' => 1,
        ]);
        $this->assertDatabaseHas('escrow_transactions', ['id' => $hold->id, 'status' => 'held']);
    }

    public function test_admin_can_retry_failed_release(): void
    {
        $order = $this->order(); $this->hold($order);
        $failed = new EscrowTransaction();
        $failed->forceFill([
            'order_id' => $order->id, 'type' => EscrowTransactionType::Release,
            'amount' => $order->artist_payout_amount, 'status' => EscrowTransactionStatus::Failed,
            'failure_reason' => 'temporary failure', 'retry_count' => 1, 'last_attempted_at' => now(),
        ]); $failed->save();

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/admin/commission/orders/{$order->id}/retry-release")
            ->assertOk()
            ->assertJsonPath('data.order.status', 'released');

        $this->assertDatabaseHas('escrow_transactions', ['order_id' => $order->id, 'type' => 'release', 'status' => 'released']);
        $this->assertDatabaseHas('order_status_history', ['order_id' => $order->id, 'to_status' => 'released']);
    }

    public function test_non_admin_cannot_retry_release(): void
    {
        $order = $this->order(); $this->hold($order);
        $this->actingAs($order->buyer, 'sanctum')
            ->postJson("/api/admin/commission/orders/{$order->id}/retry-release")
            ->assertForbidden();
    }

    public function test_retry_is_blocked_after_three_attempts(): void
    {
        $order = $this->order(); $this->hold($order);
        $failed = new EscrowTransaction();
        $failed->forceFill([
            'order_id' => $order->id, 'type' => EscrowTransactionType::Release,
            'amount' => $order->artist_payout_amount, 'status' => EscrowTransactionStatus::Failed,
            'failure_reason' => 'permanent failure', 'retry_count' => 3, 'last_attempted_at' => now(),
        ]); $failed->save();

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/admin/commission/orders/{$order->id}/retry-release")
            ->assertStatus(500);

        $this->assertSame(CommissionOrderStatus::Completed, $order->fresh()->status);
    }

    public function test_retry_requires_hold(): void
    {
        $order = $this->order();

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/admin/commission/orders/{$order->id}/retry-release")
            ->assertStatus(500);
    }

    public function test_released_order_cannot_retry(): void
    {
        $order = $this->order('released');

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/admin/commission/orders/{$order->id}/retry-release")
            ->assertStatus(500);
    }

    public function test_admin_failed_endpoint_shows_persistent_failure(): void
    {
        $order = $this->order(); $this->hold($order);
        $failed = new EscrowTransaction();
        $failed->forceFill([
            'order_id' => $order->id, 'type' => EscrowTransactionType::Release,
            'amount' => $order->artist_payout_amount, 'status' => EscrowTransactionStatus::Failed,
            'failure_reason' => 'temporary failure', 'retry_count' => 1, 'last_attempted_at' => now(),
        ]); $failed->save();

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/escrow/failed')
            ->assertOk()
            ->assertJsonPath('data.failed_states.data.0.issue', 'release_failed');
    }
}
