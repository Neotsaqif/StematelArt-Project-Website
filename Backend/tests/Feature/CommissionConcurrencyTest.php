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
use Illuminate\Support\Facades\Artisan;
use RuntimeException;
use Tests\TestCase;

class CommissionConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    private function order(string $status = 'completed'): CommissionOrder
    {
        $buyer = User::factory()->create(['role' => 'user']);
        $artist = User::factory()->create(['role' => 'artist']);
        $package = $artist->commissionPackages()->create([
            'title' => 'Concurrency Package', 'description' => 'Concurrency testing package',
            'price' => 150000, 'platform_fee_rate' => 0.1, 'delivery_time' => 7, 'active' => true,
        ]);
        $order = new CommissionOrder();
        $order->package_id = $package->id; $order->buyer_id = $buyer->id; $order->artist_id = $artist->id;
        $order->amount = 150000; $order->platform_fee_amount = 15000; $order->artist_payout_amount = 135000;
        $order->brief = 'Concurrency test'; $order->status = $status; $order->save();
        return $order;
    }

    private function hold(CommissionOrder $order): void
    {
        $hold = new EscrowTransaction();
        $hold->forceFill(['order_id' => $order->id, 'type' => EscrowTransactionType::Hold, 'amount' => $order->amount, 'status' => EscrowTransactionStatus::Held]);
        $hold->save();
    }

    private function failedRelease(CommissionOrder $order): void
    {
        $failed = new EscrowTransaction();
        $failed->forceFill(['order_id' => $order->id, 'type' => EscrowTransactionType::Release, 'amount' => $order->artist_payout_amount, 'status' => EscrowTransactionStatus::Failed, 'failure_reason' => 'RELEASE_ATTEMPT_FAILED', 'retry_count' => 0]);
        $failed->save();
    }

    public function test_duplicate_release_execution_creates_one_logical_release(): void
    {
        $order = $this->order();
        $this->hold($order);
        $service = app(EscrowService::class);

        $first = $service->release($order);
        $second = $service->release($order);

        $this->assertSame($first->id, $second->id);
        $this->assertDatabaseCount('escrow_transactions', 2);
        $this->assertSame(CommissionOrderStatus::Released, $order->fresh()->status);
    }

    public function test_duplicate_retry_execution_does_not_create_two_releases(): void
    {
        $order = $this->order();
        $this->hold($order);
        $this->failedRelease($order);
        $service = app(EscrowService::class);

        $first = $service->retryRelease($order);

        $this->expectException(RuntimeException::class);
        $service->retryRelease($order);

        $this->assertSame(CommissionOrderStatus::Released, $order->fresh()->status);
        $this->assertSame($first->id, EscrowTransaction::where('order_id', $order->id)->where('type', 'release')->first()->id);
        $this->assertDatabaseCount('escrow_transactions', 2);
    }

    public function test_duplicate_expiry_execution_creates_one_history_record(): void
    {
        $order = $this->order('pending_payment');
        $order->created_at = now()->subDays(2);
        $order->save();

        Artisan::call('commission:expire-pending-payments');
        Artisan::call('commission:expire-pending-payments');

        $this->assertSame(CommissionOrderStatus::Expired, $order->fresh()->status);
        $this->assertDatabaseCount('order_status_history', 1);
    }

    public function test_retry_without_failed_record_preserves_completed_order_and_held_amount(): void
    {
        $order = $this->order();
        $this->hold($order);

        $this->expectException(RuntimeException::class);
        app(EscrowService::class)->retryRelease($order);

        $this->assertSame(CommissionOrderStatus::Completed, $order->fresh()->status);
        $this->assertDatabaseHas('escrow_transactions', ['order_id' => $order->id, 'type' => 'hold', 'status' => 'held']);
        $this->assertDatabaseMissing('escrow_transactions', ['order_id' => $order->id, 'type' => 'release']);
    }
}
