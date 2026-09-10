<?php

namespace Tests\Feature;

use App\Models\CommissionOrder;
use App\Models\CommissionPackage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommissionOrderTest extends TestCase
{
    use RefreshDatabase;

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private function makeOrderPayload(array $overrides = []): array
    {
        return array_merge([
            'package_id'      => 1,
            'brief'           => 'I need a full-body character design with detailed background.',
            'reference_image' => 'reference-sketch.jpg',
            'deadline_at'     => now()->addDays(14)->toDateTimeString(),
        ], $overrides);
    }

    private function createPackage(User $artist, array $overrides = []): CommissionPackage
    {
        return $artist->commissionPackages()->create(array_merge([
            'title'             => 'Character Design Package',
            'description'       => 'Professional character design service.',
            'price'             => 500000,
            'platform_fee_rate' => 0.1000,
            'delivery_time'     => 7,
            'terms'             => null,
            'active'            => true,
        ], $overrides));
    }

    private function createOrder(User $buyer, CommissionPackage $package, array $overrides = []): CommissionOrder
    {
        $order = new CommissionOrder();

        $defaults = [
            'package_id'            => $package->id,
            'buyer_id'              => $buyer->id,
            'artist_id'             => $package->artist_id,
            'amount'                => $package->price,
            'platform_fee_amount'   => (int) round($package->price * $package->platform_fee_rate),
            'artist_payout_amount'  => $package->price - (int) round($package->price * $package->platform_fee_rate),
            'brief'                 => 'Test brief',
            'reference_image'       => null,
            'deadline_at'           => null,
            'status'                => 'pending_payment',
        ];

        $attributes = array_merge($defaults, $overrides);

        foreach ($attributes as $key => $value) {
            $order->{$key} = $value;
        }

        $order->save();

        return $order;
    }

    private function normalUser(): User
    {
        return User::factory()->create(['role' => 'user']);
    }

    private function artistUser(): User
    {
        return User::factory()->create(['role' => 'artist']);
    }

    private function adminUser(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    // ---------------------------------------------------------------------------
    // 1. Authentication
    // ---------------------------------------------------------------------------

    public function test_unauthenticated_user_cannot_create_order(): void
    {
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $this->postJson('/api/commission/orders', $this->makeOrderPayload(['package_id' => $package->id]))
            ->assertUnauthorized();
    }

    public function test_unauthenticated_user_cannot_list_orders(): void
    {
        $this->getJson('/api/commission/orders')->assertUnauthorized();
    }

    public function test_unauthenticated_user_cannot_view_order(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);
        $order   = $this->createOrder($buyer, $package);

        $this->getJson("/api/commission/orders/{$order->id}")->assertUnauthorized();
    }

    // ---------------------------------------------------------------------------
    // 2. Create Order
    // ---------------------------------------------------------------------------

    public function test_authenticated_user_can_create_order(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $response = $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload(['package_id' => $package->id]))
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order.package_id', $package->id)
            ->assertJsonPath('data.order.brief', 'I need a full-body character design with detailed background.');

        $this->assertDatabaseHas('commission_orders', [
            'package_id' => $package->id,
            'buyer_id'   => $buyer->id,
            'artist_id'  => $artist->id,
        ]);
    }

    public function test_created_order_status_is_pending_payment(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload(['package_id' => $package->id]))
            ->assertCreated()
            ->assertJsonPath('data.order.status', 'pending_payment');
    }

    public function test_buyer_id_comes_from_authenticated_user(): void
    {
        $buyer      = $this->normalUser();
        $otherUser  = $this->normalUser();
        $artist     = $this->artistUser();
        $package    = $this->createPackage($artist);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id' => $package->id,
                'buyer_id'   => $otherUser->id, // Injection attempt
            ]))
            ->assertCreated()
            ->assertJsonPath('data.order.buyer_id', $buyer->id);

        $this->assertDatabaseHas('commission_orders', [
            'package_id' => $package->id,
            'buyer_id'   => $buyer->id,
        ]);

        $this->assertDatabaseMissing('commission_orders', [
            'buyer_id' => $otherUser->id,
        ]);
    }

    public function test_artist_id_comes_from_package_owner(): void
    {
        $buyer       = $this->normalUser();
        $artist      = $this->artistUser();
        $otherArtist = $this->artistUser();
        $package     = $this->createPackage($artist);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id' => $package->id,
                'artist_id'  => $otherArtist->id, // Injection attempt
            ]))
            ->assertCreated()
            ->assertJsonPath('data.order.artist_id', $artist->id);

        $this->assertDatabaseHas('commission_orders', [
            'artist_id' => $artist->id,
        ]);

        $this->assertDatabaseMissing('commission_orders', [
            'artist_id' => $otherArtist->id,
        ]);
    }

    public function test_amount_comes_from_package_price(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist, ['price' => 750000]);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id' => $package->id,
                'amount'     => 1, // Injection attempt
            ]))
            ->assertCreated()
            ->assertJsonPath('data.order.amount', 750000);

        $this->assertDatabaseHas('commission_orders', [
            'amount' => 750000,
        ]);
    }

    public function test_package_must_be_active(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist, ['active' => true]);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload(['package_id' => $package->id]))
            ->assertCreated();
    }

    public function test_inactive_package_cannot_create_order(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist, ['active' => false]);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload(['package_id' => $package->id]))
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors('package_id');
    }

    // ---------------------------------------------------------------------------
    // 3. Validation
    // ---------------------------------------------------------------------------

    public function test_missing_package_id_rejected(): void
    {
        $buyer = $this->normalUser();

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload(['package_id' => null]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('package_id');
    }

    public function test_invalid_package_id_rejected(): void
    {
        $buyer = $this->normalUser();

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload(['package_id' => 99999]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('package_id');
    }

    public function test_missing_brief_rejected(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id' => $package->id,
                'brief'      => null,
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('brief');
    }

    public function test_brief_exceeds_max_length_rejected(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id' => $package->id,
                'brief'      => str_repeat('a', 5001),
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('brief');
    }

    public function test_invalid_deadline_rejected(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id'  => $package->id,
                'deadline_at' => 'not-a-date',
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('deadline_at');
    }

    public function test_deadline_in_past_rejected(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id'  => $package->id,
                'deadline_at' => now()->subDays(1)->toDateTimeString(),
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('deadline_at');
    }

    // ---------------------------------------------------------------------------
    // 4. Injection Protection
    // ---------------------------------------------------------------------------

    public function test_buyer_id_injection_blocked(): void
    {
        $buyer       = $this->normalUser();
        $otherUser   = $this->normalUser();
        $artist      = $this->artistUser();
        $package     = $this->createPackage($artist);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id' => $package->id,
                'buyer_id'   => $otherUser->id,
            ]))
            ->assertCreated()
            ->assertJsonPath('data.order.buyer_id', $buyer->id);
    }

    public function test_artist_id_injection_blocked(): void
    {
        $buyer       = $this->normalUser();
        $artist      = $this->artistUser();
        $otherArtist = $this->artistUser();
        $package     = $this->createPackage($artist);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id' => $package->id,
                'artist_id'  => $otherArtist->id,
            ]))
            ->assertCreated()
            ->assertJsonPath('data.order.artist_id', $artist->id);
    }

    public function test_amount_injection_blocked(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist, ['price' => 500000]);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id' => $package->id,
                'amount'     => 1,
            ]))
            ->assertCreated()
            ->assertJsonPath('data.order.amount', 500000);
    }

    public function test_platform_fee_amount_injection_blocked(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist, ['price' => 500000, 'platform_fee_rate' => 0.1]);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id'          => $package->id,
                'platform_fee_amount' => 0,
            ]))
            ->assertCreated()
            ->assertJsonPath('data.order.platform_fee_amount', 50000);
    }

    public function test_artist_payout_amount_injection_blocked(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist, ['price' => 500000, 'platform_fee_rate' => 0.1]);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id'           => $package->id,
                'artist_payout_amount' => 999999999,
            ]))
            ->assertCreated()
            ->assertJsonPath('data.order.artist_payout_amount', 450000);
    }

    public function test_status_injection_blocked(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/commission/orders', $this->makeOrderPayload([
                'package_id' => $package->id,
                'status'     => 'paid',
            ]))
            ->assertCreated()
            ->assertJsonPath('data.order.status', 'pending_payment');
    }

    // ---------------------------------------------------------------------------
    // 5. Authorization
    // ---------------------------------------------------------------------------

    public function test_buyer_can_view_own_order(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);
        $order   = $this->createOrder($buyer, $package);

        $this->actingAs($buyer, 'sanctum')
            ->getJson("/api/commission/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order.id', $order->id);
    }

    public function test_buyer_cannot_view_another_buyers_order(): void
    {
        $buyer      = $this->normalUser();
        $otherBuyer = $this->normalUser();
        $artist     = $this->artistUser();
        $package    = $this->createPackage($artist);
        $order      = $this->createOrder($otherBuyer, $package);

        $this->actingAs($buyer, 'sanctum')
            ->getJson("/api/commission/orders/{$order->id}")
            ->assertForbidden();
    }

    public function test_artist_can_view_order_belonging_to_them(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);
        $order   = $this->createOrder($buyer, $package);

        $this->actingAs($artist, 'sanctum')
            ->getJson("/api/commission/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.order.id', $order->id);
    }

    public function test_artist_cannot_view_order_belonging_to_another_artist(): void
    {
        $buyer       = $this->normalUser();
        $artist      = $this->artistUser();
        $otherArtist = $this->artistUser();
        $package     = $this->createPackage($artist);
        $order       = $this->createOrder($buyer, $package);

        $this->actingAs($otherArtist, 'sanctum')
            ->getJson("/api/commission/orders/{$order->id}")
            ->assertForbidden();
    }

    public function test_admin_can_view_any_order(): void
    {
        $admin   = $this->adminUser();
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);
        $order   = $this->createOrder($buyer, $package);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/commission/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.order.id', $order->id);
    }

    // ---------------------------------------------------------------------------
    // 6. List / Pagination
    // ---------------------------------------------------------------------------

    public function test_buyer_order_list_is_scoped(): void
    {
        $buyer      = $this->normalUser();
        $otherBuyer = $this->normalUser();
        $artist     = $this->artistUser();
        $package    = $this->createPackage($artist);

        $buyerOrder      = $this->createOrder($buyer, $package);
        $otherBuyerOrder = $this->createOrder($otherBuyer, $package);

        $response = $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/commission/orders')
            ->assertOk()
            ->assertJsonPath('success', true);

        $orderIds = collect($response->json('data.orders.data'))->pluck('id')->toArray();

        $this->assertContains($buyerOrder->id, $orderIds);
        $this->assertNotContains($otherBuyerOrder->id, $orderIds);
    }

    public function test_artist_order_list_is_scoped(): void
    {
        $buyer       = $this->normalUser();
        $artist      = $this->artistUser();
        $otherArtist = $this->artistUser();

        $artistPackage      = $this->createPackage($artist);
        $otherArtistPackage = $this->createPackage($otherArtist);

        $artistOrder      = $this->createOrder($buyer, $artistPackage);
        $otherArtistOrder = $this->createOrder($buyer, $otherArtistPackage);

        $response = $this->actingAs($artist, 'sanctum')
            ->getJson('/api/commission/orders')
            ->assertOk();

        $orderIds = collect($response->json('data.orders.data'))->pluck('id')->toArray();

        $this->assertContains($artistOrder->id, $orderIds);
        $this->assertNotContains($otherArtistOrder->id, $orderIds);
    }

    public function test_admin_sees_all_orders(): void
    {
        $admin   = $this->adminUser();
        $buyer1  = $this->normalUser();
        $buyer2  = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $order1 = $this->createOrder($buyer1, $package);
        $order2 = $this->createOrder($buyer2, $package);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/commission/orders')
            ->assertOk();

        $orderIds = collect($response->json('data.orders.data'))->pluck('id')->toArray();

        $this->assertContains($order1->id, $orderIds);
        $this->assertContains($order2->id, $orderIds);
    }

    public function test_pagination_works_with_default_15(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        for ($i = 0; $i < 20; $i++) {
            $this->createOrder($buyer, $package);
        }

        $response = $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/commission/orders')
            ->assertOk();

        $this->assertCount(15, $response->json('data.orders.data'));
        $this->assertEquals(20, $response->json('data.orders.total'));
    }

    public function test_per_page_maximum_enforced(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        for ($i = 0; $i < 60; $i++) {
            $this->createOrder($buyer, $package);
        }

        $response = $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/commission/orders?per_page=100')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('per_page');
    }

    // ---------------------------------------------------------------------------
    // 7. Relationships
    // ---------------------------------------------------------------------------

    public function test_package_has_orders_relationship(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);
        $order   = $this->createOrder($buyer, $package);

        $this->assertTrue($package->orders()->exists());
        $this->assertEquals($order->id, $package->orders()->first()->id);
    }

    public function test_user_has_commission_orders_relationship(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);
        $order   = $this->createOrder($buyer, $package);

        $this->assertTrue($buyer->commissionOrders()->exists());
        $this->assertEquals($order->id, $buyer->commissionOrders()->first()->id);
    }

    public function test_user_has_commission_sales_relationship(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);
        $order   = $this->createOrder($buyer, $package);

        $this->assertTrue($artist->commissionSales()->exists());
        $this->assertEquals($order->id, $artist->commissionSales()->first()->id);
    }

    public function test_order_belongs_to_package_buyer_artist(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);
        $order   = $this->createOrder($buyer, $package);

        $this->assertEquals($package->id, $order->package->id);
        $this->assertEquals($buyer->id, $order->buyer->id);
        $this->assertEquals($artist->id, $order->artist->id);
    }

    // ---------------------------------------------------------------------------
    // 8. Snapshot Behavior
    // ---------------------------------------------------------------------------

    public function test_package_price_changes_after_order_creation_but_order_amount_remains(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist, ['price' => 500000]);
        $order   = $this->createOrder($buyer, $package);

        $this->assertEquals(500000, $order->amount);

        // Package price changes
        $package->update(['price' => 750000]);

        $order->refresh();
        $this->assertEquals(500000, $order->amount); // Order amount unchanged
        $this->assertEquals(750000, $package->fresh()->price);
    }

    public function test_package_ownership_changes_after_order_but_order_artist_id_remains(): void
    {
        $buyer      = $this->normalUser();
        $artist     = $this->artistUser();
        $newArtist  = $this->artistUser();
        $package    = $this->createPackage($artist);
        $order      = $this->createOrder($buyer, $package);

        $originalArtistId = $artist->id;
        $this->assertEquals($originalArtistId, $order->artist_id);

        // Package ownership changes (hypothetically, if business rules allow it)
        // We need to use DB::statement to bypass Eloquent and test the snapshot behavior
        \DB::table('commission_packages')
            ->where('id', $package->id)
            ->update(['artist_id' => $newArtist->id]);

        $order->refresh();
        $package->refresh();

        $this->assertEquals($originalArtistId, $order->artist_id); // Order artist_id unchanged (snapshot)
        $this->assertEquals($newArtist->id, $package->artist_id); // Package artist_id changed
    }

    // ---------------------------------------------------------------------------
    // 9. Security
    // ---------------------------------------------------------------------------

    public function test_sensitive_fields_not_returned(): void
    {
        $buyer   = $this->normalUser();
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);
        $order   = $this->createOrder($buyer, $package);

        $response = $this->actingAs($buyer, 'sanctum')
            ->getJson("/api/commission/orders/{$order->id}")
            ->assertOk()
            ->json('data.order');

        $this->assertArrayNotHasKey('password', $response['buyer']);
        $this->assertArrayNotHasKey('remember_token', $response['buyer']);
        $this->assertArrayNotHasKey('password', $response['artist']);
        $this->assertArrayNotHasKey('remember_token', $response['artist']);
    }

    public function test_nonexistent_order_returns_404(): void
    {
        $buyer = $this->normalUser();

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/commission/orders/99999')
            ->assertNotFound();
    }
}
