<?php

namespace Tests\Feature;

use App\Models\CommissionPackage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommissionPackageTest extends TestCase
{
    use RefreshDatabase;

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private function makePackagePayload(array $overrides = []): array
    {
        return array_merge([
            'title'             => 'Character Design',
            'description'       => 'Full-body character design with color.',
            'price'             => 500000,
            'platform_fee_rate' => 0.1,
            'delivery_time'     => 7,
            'terms'             => 'No refunds after work has started.',
            'active'            => true,
        ], $overrides);
    }

    private function createPackage(User $artist, array $overrides = []): CommissionPackage
    {
        return $artist->commissionPackages()->create(array_merge([
            'title'             => 'Test Package',
            'description'       => 'A test commission package.',
            'price'             => 300000,
            'platform_fee_rate' => 0.1000,
            'delivery_time'     => 5,
            'terms'             => null,
            'active'            => true,
        ], $overrides));
    }

    private function artistUser(): User
    {
        return User::factory()->create(['role' => 'artist']);
    }

    private function normalUser(): User
    {
        return User::factory()->create(['role' => 'user']);
    }

    private function adminUser(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    // ---------------------------------------------------------------------------
    // 1. Unauthenticated access
    // ---------------------------------------------------------------------------

    public function test_unauthenticated_user_cannot_access_any_endpoint(): void
    {
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $this->getJson('/api/commission/packages')->assertUnauthorized();
        $this->getJson("/api/commission/packages/{$package->id}")->assertUnauthorized();
        $this->postJson('/api/artist/commission/packages', $this->makePackagePayload())->assertUnauthorized();
        $this->putJson("/api/artist/commission/packages/{$package->id}", ['title' => 'Updated'])->assertUnauthorized();
        $this->deleteJson("/api/artist/commission/packages/{$package->id}")->assertUnauthorized();
    }

    // ---------------------------------------------------------------------------
    // 2. Authorization — create
    // ---------------------------------------------------------------------------

    public function test_normal_user_cannot_create_package(): void
    {
        $user = $this->normalUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/artist/commission/packages', $this->makePackagePayload())
            ->assertForbidden();
    }

    public function test_artist_can_create_package(): void
    {
        $artist = $this->artistUser();

        $response = $this->actingAs($artist, 'sanctum')
            ->postJson('/api/artist/commission/packages', $this->makePackagePayload())
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.package.title', 'Character Design')
            ->assertJsonPath('data.package.price', 500000)
            ->assertJsonPath('data.package.active', true);

        $this->assertDatabaseHas('commission_packages', [
            'id'        => $response->json('data.package.id'),
            'artist_id' => $artist->id,
            'title'     => 'Character Design',
        ]);
    }

    public function test_admin_can_create_package(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/artist/commission/packages', $this->makePackagePayload())
            ->assertCreated()
            ->assertJsonPath('data.package.artist_id', $admin->id);
    }

    // ---------------------------------------------------------------------------
    // 3. Ownership — artist_id always comes from the authenticated user
    // ---------------------------------------------------------------------------

    public function test_owner_is_automatically_set_from_authenticated_user(): void
    {
        $artist      = $this->artistUser();
        $otherArtist = $this->artistUser();

        $response = $this->actingAs($artist, 'sanctum')
            ->postJson('/api/artist/commission/packages', $this->makePackagePayload())
            ->assertCreated();

        $this->assertDatabaseHas('commission_packages', [
            'id'        => $response->json('data.package.id'),
            'artist_id' => $artist->id,
        ]);

        $this->assertDatabaseMissing('commission_packages', [
            'id'        => $response->json('data.package.id'),
            'artist_id' => $otherArtist->id,
        ]);
    }

    public function test_artist_id_injection_is_blocked(): void
    {
        $artist      = $this->artistUser();
        $otherArtist = $this->artistUser();

        // Attacker sends artist_id pointing to another artist
        $response = $this->actingAs($artist, 'sanctum')
            ->postJson('/api/artist/commission/packages', array_merge(
                $this->makePackagePayload(),
                ['artist_id' => $otherArtist->id]
            ))
            ->assertCreated();

        // Package must be owned by the authenticated artist, not the injected one
        $this->assertDatabaseHas('commission_packages', [
            'id'        => $response->json('data.package.id'),
            'artist_id' => $artist->id,
        ]);

        $this->assertDatabaseMissing('commission_packages', [
            'id'        => $response->json('data.package.id'),
            'artist_id' => $otherArtist->id,
        ]);
    }

    public function test_role_injection_in_create_is_blocked(): void
    {
        $user = $this->normalUser();

        // User tries to escalate role via request body
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/artist/commission/packages', array_merge(
                $this->makePackagePayload(),
                ['role' => 'artist']
            ))
            ->assertForbidden();

        // No package must be created
        $this->assertDatabaseCount('commission_packages', 0);
    }

    public function test_admin_role_injection_in_create_is_blocked_for_normal_user(): void
    {
        $user = $this->normalUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/artist/commission/packages', array_merge(
                $this->makePackagePayload(),
                ['role' => 'admin']
            ))
            ->assertForbidden();

        $this->assertDatabaseCount('commission_packages', 0);
    }

    // ---------------------------------------------------------------------------
    // 4. Validation — create
    // ---------------------------------------------------------------------------

    public function test_create_requires_title_price_platform_fee_rate_and_delivery_time(): void
    {
        $artist = $this->artistUser();

        $this->actingAs($artist, 'sanctum')
            ->postJson('/api/artist/commission/packages', [])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['title', 'price', 'platform_fee_rate', 'delivery_time']]);
    }

    public function test_price_cannot_be_negative(): void
    {
        $artist = $this->artistUser();

        $this->actingAs($artist, 'sanctum')
            ->postJson('/api/artist/commission/packages', $this->makePackagePayload(['price' => -1]))
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['price']]);
    }

    public function test_price_of_zero_is_valid(): void
    {
        $artist = $this->artistUser();

        $this->actingAs($artist, 'sanctum')
            ->postJson('/api/artist/commission/packages', $this->makePackagePayload(['price' => 0]))
            ->assertCreated();
    }

    public function test_platform_fee_rate_cannot_exceed_one(): void
    {
        $artist = $this->artistUser();

        $this->actingAs($artist, 'sanctum')
            ->postJson('/api/artist/commission/packages', $this->makePackagePayload(['platform_fee_rate' => 1.5]))
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['platform_fee_rate']]);
    }

    public function test_platform_fee_rate_cannot_be_negative(): void
    {
        $artist = $this->artistUser();

        $this->actingAs($artist, 'sanctum')
            ->postJson('/api/artist/commission/packages', $this->makePackagePayload(['platform_fee_rate' => -0.1]))
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['platform_fee_rate']]);
    }

    public function test_delivery_time_must_be_at_least_one(): void
    {
        $artist = $this->artistUser();

        $this->actingAs($artist, 'sanctum')
            ->postJson('/api/artist/commission/packages', $this->makePackagePayload(['delivery_time' => 0]))
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['delivery_time']]);
    }

    public function test_title_cannot_exceed_255_characters(): void
    {
        $artist = $this->artistUser();

        $this->actingAs($artist, 'sanctum')
            ->postJson('/api/artist/commission/packages', $this->makePackagePayload([
                'title' => str_repeat('a', 256),
            ]))
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['title']]);
    }

    public function test_description_and_terms_are_nullable(): void
    {
        $artist = $this->artistUser();

        $this->actingAs($artist, 'sanctum')
            ->postJson('/api/artist/commission/packages', array_merge(
                $this->makePackagePayload(),
                ['description' => null, 'terms' => null]
            ))
            ->assertCreated()
            ->assertJsonPath('data.package.description', null)
            ->assertJsonPath('data.package.terms', null);
    }

    // ---------------------------------------------------------------------------
    // 5. Read — listing
    // ---------------------------------------------------------------------------

    public function test_authenticated_user_can_list_active_packages(): void
    {
        $artist  = $this->artistUser();
        $viewer  = $this->normalUser();
        $package = $this->createPackage($artist, ['active' => true]);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/commission/packages')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.packages.data.0.id', $package->id);
    }

    public function test_inactive_packages_are_hidden_from_default_list(): void
    {
        $artist = $this->artistUser();
        $viewer = $this->normalUser();

        $this->createPackage($artist, ['active' => true]);
        $inactive = $this->createPackage($artist, ['active' => false, 'title' => 'Hidden Package']);

        $response = $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/commission/packages')
            ->assertOk();

        $ids = collect($response->json('data.packages.data'))->pluck('id')->all();
        $this->assertNotContains($inactive->id, $ids);
    }

    public function test_list_is_paginated_with_default_of_15(): void
    {
        $artist = $this->artistUser();
        $viewer = $this->normalUser();

        // Create 20 active packages
        for ($i = 1; $i <= 20; $i++) {
            $this->createPackage($artist, ['title' => "Package {$i}"]);
        }

        $response = $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/commission/packages')
            ->assertOk();

        $this->assertCount(15, $response->json('data.packages.data'));
        $this->assertEquals(20, $response->json('data.packages.total'));
    }

    public function test_pagination_per_page_is_limited_to_50(): void
    {
        $artist = $this->artistUser();
        $viewer = $this->normalUser();

        for ($i = 1; $i <= 60; $i++) {
            $this->createPackage($artist, ['title' => "Package {$i}"]);
        }

        // Requesting 100 per_page should be rejected (max 50)
        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/commission/packages?per_page=100')
            ->assertStatus(422);
    }

    public function test_custom_per_page_within_limit_works(): void
    {
        $artist = $this->artistUser();
        $viewer = $this->normalUser();

        for ($i = 1; $i <= 30; $i++) {
            $this->createPackage($artist, ['title' => "Package {$i}"]);
        }

        $response = $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/commission/packages?per_page=10')
            ->assertOk();

        $this->assertCount(10, $response->json('data.packages.data'));
    }

    public function test_list_eager_loads_artist(): void
    {
        $artist  = $this->artistUser();
        $viewer  = $this->normalUser();
        $package = $this->createPackage($artist);

        $response = $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/commission/packages')
            ->assertOk();

        $this->assertEquals($artist->id, $response->json('data.packages.data.0.artist.id'));
        $this->assertEquals($artist->name, $response->json('data.packages.data.0.artist.name'));
    }

    // ---------------------------------------------------------------------------
    // 6. Read — show detail
    // ---------------------------------------------------------------------------

    public function test_authenticated_user_can_view_package_detail(): void
    {
        $artist  = $this->artistUser();
        $viewer  = $this->normalUser();
        $package = $this->createPackage($artist);

        $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/commission/packages/{$package->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.package.id', $package->id)
            ->assertJsonPath('data.package.artist.id', $artist->id);
    }

    public function test_show_returns_404_for_nonexistent_package(): void
    {
        $user = $this->normalUser();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/commission/packages/99999')
            ->assertNotFound();
    }

    // ---------------------------------------------------------------------------
    // 7. Update — authorization
    // ---------------------------------------------------------------------------

    public function test_artist_can_update_own_package(): void
    {
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $this->actingAs($artist, 'sanctum')
            ->putJson("/api/artist/commission/packages/{$package->id}", [
                'title' => 'Updated Title',
            ])
            ->assertOk()
            ->assertJsonPath('data.package.title', 'Updated Title');

        $this->assertDatabaseHas('commission_packages', [
            'id'    => $package->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_artist_cannot_update_another_artists_package(): void
    {
        $artistA  = $this->artistUser();
        $artistB  = $this->artistUser();
        $packageB = $this->createPackage($artistB);

        $this->actingAs($artistA, 'sanctum')
            ->putJson("/api/artist/commission/packages/{$packageB->id}", [
                'title' => 'Unauthorized Update',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('commission_packages', [
            'id'    => $packageB->id,
            'title' => 'Unauthorized Update',
        ]);
    }

    public function test_admin_can_update_any_package(): void
    {
        $artist  = $this->artistUser();
        $admin   = $this->adminUser();
        $package = $this->createPackage($artist);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/artist/commission/packages/{$package->id}", [
                'title' => 'Admin Updated Title',
            ])
            ->assertOk()
            ->assertJsonPath('data.package.title', 'Admin Updated Title');
    }

    public function test_normal_user_cannot_update_package(): void
    {
        $artist  = $this->artistUser();
        $user    = $this->normalUser();
        $package = $this->createPackage($artist);

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/artist/commission/packages/{$package->id}", [
                'title' => 'User Update Attempt',
            ])
            ->assertForbidden();
    }

    public function test_update_cannot_reassign_ownership(): void
    {
        $artistA  = $this->artistUser();
        $artistB  = $this->artistUser();
        $package  = $this->createPackage($artistA);

        // Artist A tries to reassign to Artist B via update
        $this->actingAs($artistA, 'sanctum')
            ->putJson("/api/artist/commission/packages/{$package->id}", [
                'artist_id' => $artistB->id,
                'title'     => 'Re-ownership Attempt',
            ])
            ->assertOk();

        // artist_id must remain Artist A
        $this->assertDatabaseHas('commission_packages', [
            'id'        => $package->id,
            'artist_id' => $artistA->id,
        ]);
    }

    // ---------------------------------------------------------------------------
    // 8. Deactivate (DELETE = soft deactivation)
    // ---------------------------------------------------------------------------

    public function test_artist_can_deactivate_own_package(): void
    {
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist, ['active' => true]);

        $this->actingAs($artist, 'sanctum')
            ->deleteJson("/api/artist/commission/packages/{$package->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('commission_packages', [
            'id'     => $package->id,
            'active' => false,
        ]);
    }

    public function test_deactivated_package_still_exists_in_database(): void
    {
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $this->actingAs($artist, 'sanctum')
            ->deleteJson("/api/artist/commission/packages/{$package->id}")
            ->assertOk();

        // Record persists (soft deactivation, not hard delete)
        $this->assertDatabaseHas('commission_packages', ['id' => $package->id]);
    }

    public function test_artist_cannot_deactivate_another_artists_package(): void
    {
        $artistA  = $this->artistUser();
        $artistB  = $this->artistUser();
        $packageB = $this->createPackage($artistB);

        $this->actingAs($artistA, 'sanctum')
            ->deleteJson("/api/artist/commission/packages/{$packageB->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('commission_packages', [
            'id'     => $packageB->id,
            'active' => true,
        ]);
    }

    public function test_admin_can_deactivate_any_package(): void
    {
        $artist  = $this->artistUser();
        $admin   = $this->adminUser();
        $package = $this->createPackage($artist);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/artist/commission/packages/{$package->id}")
            ->assertOk();

        $this->assertDatabaseHas('commission_packages', [
            'id'     => $package->id,
            'active' => false,
        ]);
    }

    public function test_normal_user_cannot_deactivate_package(): void
    {
        $artist  = $this->artistUser();
        $user    = $this->normalUser();
        $package = $this->createPackage($artist);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/artist/commission/packages/{$package->id}")
            ->assertForbidden();
    }

    // ---------------------------------------------------------------------------
    // 9. Sensitive field protection
    // ---------------------------------------------------------------------------

    public function test_response_does_not_leak_artist_password(): void
    {
        $artist  = $this->artistUser();
        $viewer  = $this->normalUser();
        $package = $this->createPackage($artist);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/commission/packages')
            ->assertOk()
            ->assertJsonMissingPath('data.packages.data.0.artist.password');
    }

    public function test_response_does_not_leak_artist_remember_token(): void
    {
        $artist  = $this->artistUser();
        $viewer  = $this->normalUser();
        $package = $this->createPackage($artist);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/commission/packages')
            ->assertOk()
            ->assertJsonMissingPath('data.packages.data.0.artist.remember_token');
    }

    public function test_show_response_does_not_leak_artist_sensitive_fields(): void
    {
        $artist  = $this->artistUser();
        $viewer  = $this->normalUser();
        $package = $this->createPackage($artist);

        $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/commission/packages/{$package->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.package.artist.password')
            ->assertJsonMissingPath('data.package.artist.remember_token');
    }

    // ---------------------------------------------------------------------------
    // 10. Relationships
    // ---------------------------------------------------------------------------

    public function test_user_has_commission_packages_relationship(): void
    {
        $artist   = $this->artistUser();
        $package1 = $this->createPackage($artist, ['title' => 'Package A']);
        $package2 = $this->createPackage($artist, ['title' => 'Package B']);

        $this->assertCount(2, $artist->commissionPackages);
        $this->assertTrue($artist->commissionPackages->contains($package1));
        $this->assertTrue($artist->commissionPackages->contains($package2));
    }

    public function test_commission_package_has_artist_relationship(): void
    {
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $this->assertTrue($package->artist->is($artist));
        $this->assertEquals($artist->name, $package->artist->name);
    }

    public function test_delete_artist_cascades_to_commission_packages(): void
    {
        $artist  = $this->artistUser();
        $package = $this->createPackage($artist);

        $packageId = $package->id;
        $artist->delete();

        $this->assertDatabaseMissing('commission_packages', ['id' => $packageId]);
    }

    // ---------------------------------------------------------------------------
    // 11. Database constraints
    // ---------------------------------------------------------------------------

    public function test_database_foreign_key_constraint_enforced(): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        CommissionPackage::create([
            'artist_id'         => 99999, // Non-existent user
            'title'             => 'Orphan Package',
            'price'             => 100000,
            'platform_fee_rate' => 0.1000,
            'delivery_time'     => 5,
            'active'            => true,
        ]);
    }

    // ---------------------------------------------------------------------------
    // 12. 404 for write routes
    // ---------------------------------------------------------------------------

    public function test_update_nonexistent_package_returns_404(): void
    {
        $artist = $this->artistUser();

        $this->actingAs($artist, 'sanctum')
            ->putJson('/api/artist/commission/packages/99999', ['title' => 'Ghost'])
            ->assertNotFound();
    }

    public function test_delete_nonexistent_package_returns_404(): void
    {
        $artist = $this->artistUser();

        $this->actingAs($artist, 'sanctum')
            ->deleteJson('/api/artist/commission/packages/99999')
            ->assertNotFound();
    }
}
