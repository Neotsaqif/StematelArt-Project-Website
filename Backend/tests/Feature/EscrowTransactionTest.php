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

class EscrowTransactionTest extends TestCase
{
    use RefreshDatabase;

    private function order(User $buyer, User $artist, string $status = 'paid'): CommissionOrder
    {
        $package = $artist->commissionPackages()->create([
            'title' => 'Escrow Package', 'description' => 'Test', 'price' => 150000,
            'platform_fee_rate' => 0.1, 'delivery_time' => 7, 'active' => true,
        ]);
        $order = new CommissionOrder();
        $order->package_id = $package->id; $order->buyer_id = $buyer->id; $order->artist_id = $artist->id;
        $order->amount = 150000; $order->platform_fee_amount = 15000; $order->artist_payout_amount = 135000;
        $order->brief = 'Escrow'; $order->status = $status; $order->save();
        return $order;
    }

    public function test_paid_order_creates_one_hold_with_snapshot_amount(): void
    {
        $order = $this->order(User::factory()->create(), User::factory()->create(['role' => 'artist']));
        $hold = app(EscrowService::class)->createHold($order, 'midtrans-tx-1');
        $this->assertSame(EscrowTransactionType::Hold, $hold->type);
        $this->assertSame(EscrowTransactionStatus::Held, $hold->status);
        $this->assertSame(150000, $hold->amount);
        $this->assertSame('midtrans-tx-1', $hold->gateway_reference_id);
        $this->assertDatabaseCount('escrow_transactions', 1);
        $this->assertTrue($order->fresh()->escrowTransactions()->exists());
    }

    public function test_duplicate_hold_is_idempotent(): void
    {
        $order = $this->order(User::factory()->create(), User::factory()->create(['role' => 'artist']));
        $first = app(EscrowService::class)->createHold($order, 'tx-1');
        $second = app(EscrowService::class)->createHold($order, 'tx-2');
        $this->assertSame($first->id, $second->id);
        $this->assertDatabaseCount('escrow_transactions', 1);
    }

    public function test_non_paid_states_are_rejected(): void
    {
        foreach (['pending_payment', 'cancelled', 'expired', 'in_progress', 'delivered', 'completed', 'released'] as $status) {
            $order = $this->order(User::factory()->create(), User::factory()->create(['role' => 'artist']), $status);
            $this->expectException(RuntimeException::class);
            app(EscrowService::class)->createHold($order);
        }
    }

    public function test_model_blocks_mass_assignment_of_server_fields(): void
    {
        $transaction = new EscrowTransaction();
        $this->expectException(\Illuminate\Database\Eloquent\MassAssignmentException::class);
        $transaction->fill(['order_id' => 99, 'amount' => 1, 'type' => 'release', 'status' => 'held']);
        $this->assertNull($transaction->order_id);
        $this->assertNull($transaction->amount);
        $this->assertNull($transaction->type);
        $this->assertNull($transaction->status);
    }

    public function test_hold_failure_rolls_back(): void
    {
        $order = $this->order(User::factory()->create(), User::factory()->create(['role' => 'artist']));
        Event::listen('eloquent.creating: ' . EscrowTransaction::class, function () { throw new RuntimeException('failed'); });
        try {
            $this->expectException(RuntimeException::class);
            app(EscrowService::class)->createHold($order);
        } finally {
            Event::forget('eloquent.creating: ' . EscrowTransaction::class);
        }
        $this->assertSame(CommissionOrderStatus::Paid, $order->fresh()->status);
        $this->assertDatabaseCount('escrow_transactions', 0);
    }

}
