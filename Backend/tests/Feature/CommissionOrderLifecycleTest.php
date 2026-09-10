<?php

namespace Tests\Feature;

use App\Models\CommissionOrder;
use App\Models\CommissionPackage;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use RuntimeException;
use Tests\TestCase;

class CommissionOrderLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function artist(): User
    {
        return User::factory()->create(['role' => 'artist']);
    }

    private function buyer(): User
    {
        return User::factory()->create(['role' => 'user']);
    }

    private function package(User $artist): CommissionPackage
    {
        return $artist->commissionPackages()->create([
            'title' => 'Lifecycle Package',
            'description' => 'Test package',
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
        $order->brief = 'Lifecycle test';
        $order->status = $status;
        $order->save();

        return $order;
    }

    public function test_artist_can_start_paid_order(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist);

        $this->actingAs($artist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/start")
            ->assertOk()
            ->assertJsonPath('data.order.status', 'in_progress');
    }

    public function test_artist_can_deliver_in_progress_order(): void
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

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertOk()
            ->assertJsonPath('data.order.status', 'completed');
    }

    public function test_invalid_transition_returns_conflict(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');

        $this->actingAs($artist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/start")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertSame('delivered', $order->fresh()->status->value);
        $this->assertDatabaseCount('order_status_history', 0);
    }

    public function test_buyer_cannot_start_or_deliver_order(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist);

        $this->actingAs($buyer, 'sanctum')->postJson("/api/commission/orders/{$order->id}/start")->assertForbidden();
        $this->actingAs($buyer, 'sanctum')->postJson("/api/commission/orders/{$order->id}/deliver")->assertForbidden();

        $this->assertSame('paid', $order->fresh()->status->value);
        $this->assertDatabaseCount('order_status_history', 0);
    }

    public function test_artist_cannot_complete_order(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'delivered');

        $this->actingAs($artist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertForbidden();

        $this->assertSame('delivered', $order->fresh()->status->value);
    }

    public function test_buyer_cannot_complete_another_buyers_order(): void
    {
        $buyer = $this->buyer();
        $otherBuyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($otherBuyer, $artist, 'delivered');

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/complete")
            ->assertForbidden();
    }

    public function test_artist_cannot_start_another_artists_order(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $otherArtist = $this->artist();
        $order = $this->order($buyer, $otherArtist);

        $this->actingAs($artist, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/start")
            ->assertForbidden();
    }

    public function test_admin_cannot_perform_lifecycle_mutation(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/start")
            ->assertForbidden();
    }

    public function test_valid_transitions_create_history_with_actor(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist);

        $this->actingAs($artist, 'sanctum')->postJson("/api/commission/orders/{$order->id}/start")->assertOk();
        $this->actingAs($artist, 'sanctum')->postJson("/api/commission/orders/{$order->id}/deliver");
        $this->actingAs($buyer, 'sanctum')->postJson("/api/commission/orders/{$order->id}/complete");

        $this->assertDatabaseCount('order_status_history', 3);
        $this->assertDatabaseHas('order_status_history', ['order_id' => $order->id, 'from_status' => 'paid', 'to_status' => 'in_progress', 'actor_id' => $artist->id]);
        $this->assertDatabaseHas('order_status_history', ['order_id' => $order->id, 'from_status' => 'in_progress', 'to_status' => 'delivered', 'actor_id' => $artist->id]);
        $this->assertDatabaseHas('order_status_history', ['order_id' => $order->id, 'from_status' => 'delivered', 'to_status' => 'completed', 'actor_id' => $buyer->id]);
    }

    public function test_invalid_transition_does_not_create_history(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist, 'released');

        $this->actingAs($artist, 'sanctum')->postJson("/api/commission/orders/{$order->id}/start")->assertStatus(409);

        $this->assertDatabaseCount('order_status_history', 0);
    }

    public function test_authorization_failure_does_not_change_status_or_history(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist);
        $otherArtist = $this->artist();

        $this->actingAs($otherArtist, 'sanctum')->postJson("/api/commission/orders/{$order->id}/start")->assertForbidden();

        $this->assertSame('paid', $order->fresh()->status->value);
        $this->assertDatabaseCount('order_status_history', 0);
    }

    public function test_repeated_transition_is_rejected(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist);

        $this->actingAs($artist, 'sanctum')->postJson("/api/commission/orders/{$order->id}/start")->assertOk();
        $this->actingAs($artist, 'sanctum')->postJson("/api/commission/orders/{$order->id}/start")->assertStatus(409);

        $this->assertDatabaseCount('order_status_history', 1);
    }

    public function test_history_failure_rolls_back_order_status_and_history(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist);

        Event::listen('eloquent.creating: ' . OrderStatusHistory::class, function () {
            throw new RuntimeException('history failure');
        });

        try {
            $this->actingAs($artist, 'sanctum')
                ->postJson("/api/commission/orders/{$order->id}/start")
                ->assertStatus(500);
        } finally {
            Event::forget('eloquent.creating: ' . OrderStatusHistory::class);
        }

        $this->assertSame('paid', $order->fresh()->status->value);
        $this->assertDatabaseCount('order_status_history', 0);
    }
}
