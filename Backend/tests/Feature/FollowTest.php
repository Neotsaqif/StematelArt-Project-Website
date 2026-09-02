<?php

namespace Tests\Feature;

use App\Models\Follow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\UniqueConstraintViolationException;
use Tests\TestCase;

class FollowTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_follow_another_user(): void
    {
        $follower = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($follower, 'sanctum')
            ->postJson("/api/users/{$target->id}/follow")
            ->assertCreated()
            ->assertJsonPath('data.following', true);

        $this->assertDatabaseHas('follows', [
            'follower_id' => $follower->id,
            'following_id' => $target->id,
        ]);
    }

    public function test_unauthenticated_user_cannot_follow(): void
    {
        $target = User::factory()->create();

        $this->postJson("/api/users/{$target->id}/follow")
            ->assertUnauthorized();
    }

    public function test_user_cannot_follow_themselves(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/users/{$user->id}/follow")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You cannot follow yourself.');
    }

    public function test_duplicate_follow_is_rejected_without_duplicate_rows(): void
    {
        $follower = User::factory()->create();
        $target = User::factory()->create();
        $this->actingAs($follower, 'sanctum')
            ->postJson("/api/users/{$target->id}/follow")
            ->assertCreated();

        $this->actingAs($follower, 'sanctum')
            ->postJson("/api/users/{$target->id}/follow")
            ->assertConflict()
            ->assertJsonPath('message', 'Already following this user.');

        $this->assertSame(1, Follow::where('follower_id', $follower->id)
            ->where('following_id', $target->id)
            ->count());
    }

    public function test_authenticated_user_can_unfollow_only_the_target_relationship(): void
    {
        $follower = User::factory()->create();
        $target = User::factory()->create();
        $otherTarget = User::factory()->create();
        Follow::create(['follower_id' => $follower->id, 'following_id' => $target->id]);
        Follow::create(['follower_id' => $follower->id, 'following_id' => $otherTarget->id]);

        $this->actingAs($follower, 'sanctum')
            ->deleteJson("/api/users/{$target->id}/follow")
            ->assertOk()
            ->assertJsonPath('data.following', false);

        $this->assertDatabaseMissing('follows', [
            'follower_id' => $follower->id,
            'following_id' => $target->id,
        ]);
        $this->assertDatabaseHas('follows', [
            'follower_id' => $follower->id,
            'following_id' => $otherTarget->id,
        ]);
    }

    public function test_unfollow_requires_an_existing_relationship(): void
    {
        $follower = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($follower, 'sanctum')
            ->deleteJson("/api/users/{$target->id}/follow")
            ->assertNotFound()
            ->assertJsonPath('message', 'Follow relationship not found.');
    }

    public function test_followers_endpoint_is_paginated_and_hides_sensitive_fields(): void
    {
        $target = User::factory()->create();
        User::factory()->count(16)->create()->each(
            fn (User $follower) => Follow::create([
                'follower_id' => $follower->id,
                'following_id' => $target->id,
            ])
        );

        $this->actingAs($target, 'sanctum')
            ->getJson("/api/users/{$target->id}/followers")
            ->assertOk()
            ->assertJsonPath('data.users.per_page', 15)
            ->assertJsonCount(15, 'data.users.data')
            ->assertJsonMissingPath('data.users.data.0.password')
            ->assertJsonMissingPath('data.users.data.0.remember_token');
    }

    public function test_following_endpoint_is_paginated(): void
    {
        $follower = User::factory()->create();
        User::factory()->count(16)->create()->each(
            fn (User $target) => Follow::create([
                'follower_id' => $follower->id,
                'following_id' => $target->id,
            ])
        );

        $this->actingAs($follower, 'sanctum')
            ->getJson("/api/users/{$follower->id}/following")
            ->assertOk()
            ->assertJsonPath('data.users.per_page', 15)
            ->assertJsonCount(15, 'data.users.data');
    }

    public function test_pagination_size_is_limited_to_fifty(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/users/{$user->id}/followers?per_page=51")
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['per_page']]);
    }

    public function test_follower_id_injection_does_not_change_authenticated_follower(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $userC = User::factory()->create();

        $this->actingAs($userA, 'sanctum')
            ->postJson("/api/users/{$userC->id}/follow", [
                'follower_id' => $userB->id,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('follows', [
            'follower_id' => $userA->id,
            'following_id' => $userC->id,
        ]);
        $this->assertDatabaseMissing('follows', [
            'follower_id' => $userB->id,
            'following_id' => $userC->id,
        ]);
    }

    public function test_different_users_can_follow_the_same_target_independently(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($userA, 'sanctum')
            ->postJson("/api/users/{$target->id}/follow")
            ->assertCreated();
        $this->actingAs($userB, 'sanctum')
            ->postJson("/api/users/{$target->id}/follow")
            ->assertCreated();

        $this->assertSame(2, $target->followers()->count());
    }

    public function test_missing_target_user_returns_standard_api_not_found(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/users/999999/followers')
            ->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Resource not found.');
    }

    public function test_follow_foreign_keys_cascade_when_user_is_deleted(): void
    {
        $follower = User::factory()->create();
        $target = User::factory()->create();
        Follow::create(['follower_id' => $follower->id, 'following_id' => $target->id]);

        $follower->delete();

        $this->assertDatabaseMissing('follows', [
            'follower_id' => $follower->id,
            'following_id' => $target->id,
        ]);
    }

    public function test_database_unique_constraint_rejects_duplicate_follow(): void
    {
        $this->expectException(UniqueConstraintViolationException::class);

        $follower = User::factory()->create();
        $target = User::factory()->create();
        Follow::create(['follower_id' => $follower->id, 'following_id' => $target->id]);
        Follow::create(['follower_id' => $follower->id, 'following_id' => $target->id]);
    }
}
