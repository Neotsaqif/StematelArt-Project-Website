<?php

namespace Tests\Feature;

use App\Enums\CommissionOrderStatus;
use App\Exceptions\PaymentProviderException;
use App\Models\CommissionOrder;
use App\Models\CommissionPackage;
use App\Models\User;
use App\Services\Payments\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class MidtransPaymentTest extends TestCase
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
            'title' => 'Payment Package',
            'description' => 'Payment test package',
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
        $order->brief = 'Payment test';
        $order->status = $status;
        $order->save();

        return $order;
    }

    private function mockSuccess(): void
    {
        $this->mock(MidtransService::class, function ($mock) {
            $mock->shouldReceive('createSnapTransaction')
                ->once()
                ->andReturn([
                    'gateway_order_id' => 'STEMATELART-COMMISSION-1',
                    'snap_token' => 'snap-token-test',
                    'redirect_url' => 'https://example.test/redirect',
                ]);
        });
    }

    public function test_authenticated_buyer_can_create_payment(): void
    {
        $buyer = $this->buyer();
        $order = $this->order($buyer, $this->artist());
        $this->mockSuccess();

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/payment")
            ->assertOk()
            ->assertJsonPath('data.payment.snap_token', 'snap-token-test')
            ->assertJsonPath('data.payment.order_id', 'STEMATELART-COMMISSION-1');

        $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
    }

    public function test_unauthenticated_cannot_create_payment(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $this->postJson("/api/commission/orders/{$order->id}/payment")
            ->assertUnauthorized();
    }

    public function test_artist_and_unrelated_user_cannot_create_payment(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist);
        $otherUser = $this->buyer();

        $this->actingAs($artist, 'sanctum')->postJson("/api/commission/orders/{$order->id}/payment")->assertForbidden();
        $this->actingAs($otherUser, 'sanctum')->postJson("/api/commission/orders/{$order->id}/payment")->assertForbidden();
    }

    public function test_payment_requires_pending_payment_status(): void
    {
        foreach (['paid', 'cancelled', 'expired', 'released'] as $status) {
            $buyer = $this->buyer();
            $order = $this->order($buyer, $this->artist(), $status);

            $this->actingAs($buyer, 'sanctum')
                ->postJson("/api/commission/orders/{$order->id}/payment")
                ->assertStatus(409);
        }
    }

    public function test_amount_and_identity_tampering_are_ignored(): void
    {
        $buyer = $this->buyer();
        $artist = $this->artist();
        $order = $this->order($buyer, $artist);
        $this->mockSuccess();

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/payment", [
                'amount' => 1,
                'artist_id' => 999,
                'buyer_id' => 999,
                'status' => 'paid',
            ])
            ->assertOk();

        $this->assertSame(150000, $order->fresh()->amount);
        $this->assertSame($artist->id, $order->fresh()->artist_id);
        $this->assertSame($buyer->id, $order->fresh()->buyer_id);
        $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
    }

    public function test_server_key_is_not_returned(): void
    {
        $buyer = $this->buyer();
        $order = $this->order($buyer, $this->artist());
        $this->mockSuccess();

        $response = $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/payment")
            ->assertOk();

        $this->assertArrayNotHasKey('server_key', $response->json('data.payment'));
    }

    public function test_duplicate_payment_reuses_existing_reference_and_token(): void
    {
        $buyer = $this->buyer();
        $order = $this->order($buyer, $this->artist());
        $order->forceFill([
            'gateway_order_id' => 'STEMATELART-COMMISSION-' . $order->id,
            'snap_token' => 'existing-token',
        ])->save();

        $mock = Mockery::mock(MidtransService::class);
        $mock->shouldNotReceive('createSnapTransaction');
        $this->app->instance(MidtransService::class, $mock);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/payment")
            ->assertOk()
            ->assertJsonPath('data.payment.snap_token', 'existing-token');
    }

    public function test_provider_error_returns_generic_502(): void
    {
        $buyer = $this->buyer();
        $order = $this->order($buyer, $this->artist());
        $this->mock(MidtransService::class, function ($mock) {
            $mock->shouldReceive('createSnapTransaction')
                ->once()
                ->andThrow(new PaymentProviderException('secret provider details'));
        });

        $response = $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/commission/orders/{$order->id}/payment")
            ->assertStatus(502)
            ->assertJsonPath('message', 'Payment provider is temporarily unavailable.');

        $this->assertStringNotContainsString('secret provider details', $response->getContent());
        $this->assertSame(CommissionOrderStatus::PendingPayment, $order->fresh()->status);
    }

    public function test_payment_route_requires_sanctum(): void
    {
        $order = $this->order($this->buyer(), $this->artist());

        $this->postJson("/api/commission/orders/{$order->id}/payment")
            ->assertUnauthorized();
    }
}
