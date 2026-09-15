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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use RuntimeException;
use Tests\TestCase;

class CommissionOrderReleaseTest extends TestCase
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
            'title' => 'Release Package',
            'description' => 'Test package for release',
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
        $order->brief = 'Release test';
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

    public function test_paid_artist_can_start(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'paid');

        $this->actingAs($artist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/start")
            ->assertOk()
            ->assertJsonPath('data.order.status', 'in_progress');
    }

    public function test_unrelated_artist_cannot_start(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $otherArtist = $this->artist();
        $order = $this->order($buyer, $artist, 'paid');

        $this->actingAs($otherArtist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/start")
            ->assertForbidden();

        $this->assertSame('paid', $order->fresh()->status->value);
    }

    public function test_in_progress_artist_can_deliver(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'in_progress');

        $this->actingAs($artist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/deliver")
            ->assertOk()
            ->assertJsonPath('data.order.status', 'delivered');
    }

    public function test_buyer_can_complete_delivered_order(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');
        $this->createHold($order);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertOk();

        $this->assertSame('released', $order->fresh()->status->value);
    }

    public function test_unrelated_buyer_cannot_complete(): void
    {
        $buyer = $this->buyer();
        $otherBuyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');

        $this->actingAs($otherBuyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertForbidden();

        $this->assertSame('delivered', $order->fresh()->status->value);
    }

    public function test_complete_creates_delivered_to_completed_history(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');
        $this->createHold($order);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertOk();

        $this->assertDatabaseHas('order_status_history', [
            'order_id' => $order->id,
            'from_status' => 'delivered',
            'to_status' => 'completed',
            'actor_id' => $buyer->id,
        ]);
    }

    public function test_complete_automatically_triggers_release(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');
        $this->createHold($order);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertOk();

        $this->assertSame('released', $order->fresh()->status->value);
        $this->assertDatabaseHas('escrow_transactions', [
            'order_id' => $order->id,
            'type' => 'release',
            'status' => 'released',
        ]);
    }

    public function test_release_creates_escrow_release_record(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');
        $this->createHold($order);

        app(EscrowService::class)->release($order);

        $this->assertDatabaseHas('escrow_transactions', [
            'order_id' => $order->id,
            'type' => 'release',
            'status' => 'released',
        ]);
    }

    public function test_release_amount_equals_artist_payout_amount(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');
        $this->createHold($order);

        $release = app(EscrowService::class)->release($order);

        $this->assertSame(135000, $release->amount);
        $this->assertSame($order->artist_payout_amount, $release->amount);
    }

    public function test_release_requires_existing_held_transaction(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Valid hold transaction not found.');

        app(EscrowService::class)->release($order);
    }

    public function test_release_requires_completed_order(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'paid');
        $this->createHold($order);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Escrow release requires a completed order.');

        app(EscrowService::class)->release($order);
    }

    public function test_release_cannot_execute_twice(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');
        $this->createHold($order);

        $first = app(EscrowService::class)->release($order);
        $second = app(EscrowService::class)->release($order);

        $this->assertSame($first->id, $second->id);
        $this->assertDatabaseCount('escrow_transactions', 2);
    }

    public function test_duplicate_complete_safe(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');
        $this->createHold($order);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertOk();

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertStatus(409);

        $this->assertDatabaseCount('escrow_transactions', 2);
    }

    public function test_release_without_hold_fails(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');

        $this->expectException(RuntimeException::class);
        app(EscrowService::class)->release($order);

        $this->assertDatabaseMissing('escrow_transactions', [
            'order_id' => $order->id,
            'type' => 'release',
        ]);
    }

    public function test_hold_amount_mismatch_fails(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');

        $hold = new EscrowTransaction();
        $hold->forceFill([
            'order_id' => $order->id,
            'type' => EscrowTransactionType::Hold,
            'amount' => 100000,
            'gateway_reference_id' => 'test-tx-ref',
            'status' => EscrowTransactionStatus::Held,
        ]);
        $hold->save();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Hold amount mismatch with order amount.');

        app(EscrowService::class)->release($order);
    }

    public function test_invalid_state_fails(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'pending_payment');

        $this->expectException(RuntimeException::class);

        app(EscrowService::class)->release($order);
    }

    public function test_system_release_actor_id_is_null(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');
        $this->createHold($order);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertOk();

        $this->assertDatabaseHas('order_status_history', [
            'order_id' => $order->id,
            'from_status' => 'completed',
            'to_status' => 'released',
            'actor_id' => null,
        ]);
    }

    public function test_buyer_completion_actor_id_is_buyer(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');
        $this->createHold($order);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertOk();

        $this->assertDatabaseHas('order_status_history', [
            'order_id' => $order->id,
            'from_status' => 'delivered',
            'to_status' => 'completed',
            'actor_id' => $buyer->id,
        ]);
    }

    public function test_hold_preserved_if_release_fails(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');
        $hold = $this->createHold($order);

        Event::listen('eloquent.creating: ' . EscrowTransaction::class, function ($transaction) {
            if ($transaction->type === EscrowTransactionType::Release) {
                throw new RuntimeException('release creation failed');
            }
        });

        try {
            $this->actingAs($buyer, 'sanctum')
                ->postJson("/api/commission/orders/{$order->id}/complete")
                ->assertOk();
        } finally {
            Event::forget('eloquent.creating: ' . EscrowTransaction::class);
        }

        $this->assertDatabaseHas('escrow_transactions', [
            'id' => $hold->id,
            'type' => 'hold',
            'status' => 'held',
        ]);
    }

    public function test_order_remains_completed_if_release_fails(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');
        $this->createHold($order);

        Event::listen('eloquent.creating: ' . EscrowTransaction::class, function ($transaction) {
            if ($transaction->type === EscrowTransactionType::Release) {
                throw new RuntimeException('release creation failed');
            }
        });

        try {
            $this->actingAs($buyer, 'sanctum')
                ->postJson("/api/commission/orders/{$order->id}/complete")
                ->assertOk();
        } finally {
            Event::forget('eloquent.creating: ' . EscrowTransaction::class);
        }

        $this->assertSame('completed', $order->fresh()->status->value);
    }

    public function test_artist_cannot_complete(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');

        $this->actingAs($artist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertForbidden();

        $this->assertSame('delivered', $order->fresh()->status->value);
    }

    public function test_buyer_cannot_deliver(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'in_progress');

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/deliver")
            ->assertForbidden();

        $this->assertSame('in_progress', $order->fresh()->status->value);
    }

    public function test_buyer_cannot_start(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'paid');

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/start")
            ->assertForbidden();

        $this->assertSame('paid', $order->fresh()->status->value);
    }

    public function test_admin_cannot_arbitrary_release(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertForbidden();

        $this->assertSame('delivered', $order->fresh()->status->value);
    }

    public function test_no_arbitrary_status_injection(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'paid');

        $response = $this->actingAs($buyer, 'sanctum')
            ->putJson("/api/commission/orders/{$order->id}", [
                'status' => 'released',
            ]);

        $response->assertStatus(405);

        $this->assertSame('paid', $order->fresh()->status->value);
    }

    public function test_release_creates_completed_to_released_history(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'completed');
        $this->createHold($order);

        app(EscrowService::class)->release($order);

        $this->assertDatabaseHas('order_status_history', [
            'order_id' => $order->id,
            'from_status' => 'completed',
            'to_status' => 'released',
            'actor_id' => null,
        ]);
    }

    public function test_invalid_transition_does_not_create_release(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'paid');

        $this->actingAs($artist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/deliver")
            ->assertStatus(409);

        $this->assertDatabaseMissing('escrow_transactions', [
            'order_id' => $order->id,
            'type' => 'release',
        ]);
    }
}
