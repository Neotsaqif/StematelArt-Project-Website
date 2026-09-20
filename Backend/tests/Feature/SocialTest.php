<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SocialTest extends TestCase
{
    use RefreshDatabase;

    // --- LIKES ---

    public function test_user_can_like_and_unlike_a_post(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/posts/{$post->id}/like")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.liked', true);

        $this->assertDatabaseHas('likes', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}/like")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.liked', false);

        $this->assertDatabaseMissing('likes', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);
    }

    public function test_duplicate_likes_do_not_create_duplicate_records(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/posts/{$post->id}/like")
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/posts/{$post->id}/like")
            ->assertOk();

        $this->assertDatabaseCount('likes', 1);
    }

    public function test_likes_are_isolated_between_users(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($userA, 'sanctum')
            ->postJson("/api/posts/{$post->id}/like")
            ->assertOk();

        $this->assertDatabaseHas('likes', ['user_id' => $userA->id, 'post_id' => $post->id]);
        $this->assertDatabaseMissing('likes', ['user_id' => $userB->id, 'post_id' => $post->id]);
    }

    // --- SAVES ---

    public function test_user_can_save_and_unsave_a_post(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/posts/{$post->id}/save")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.saved', true);

        $this->assertDatabaseHas('saves', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}/save")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.saved', false);

        $this->assertDatabaseMissing('saves', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);
    }

    public function test_likes_and_saves_are_independent(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/posts/{$post->id}/like")
            ->assertOk();

        $this->assertDatabaseHas('likes', ['user_id' => $user->id, 'post_id' => $post->id]);
        $this->assertDatabaseMissing('saves', ['user_id' => $user->id, 'post_id' => $post->id]);
    }

    // --- COMMENTS ---

    public function test_user_can_list_add_and_delete_comments(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        // Add comment
        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/posts/{$post->id}/comments", [
                'body' => 'Great artwork!',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.comment.body', 'Great artwork!');

        $commentId = $response->json('data.comment.id');

        // List comments
        $this->actingAs($user, 'sanctum')
            ->getJson("/api/posts/{$post->id}/comments")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.comments');

        // Delete comment as owner
        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/comments/{$commentId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('comments', ['id' => $commentId]);
    }

    public function test_unauthorized_user_cannot_delete_another_users_comment(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $post = Post::factory()->create();

        $comment = Comment::create([
            'user_id' => $userA->id,
            'post_id' => $post->id,
            'body' => 'Owner comment',
        ]);

        $this->actingAs($userB, 'sanctum')
            ->deleteJson("/api/comments/{$comment->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('comments', ['id' => $comment->id]);
    }

    public function test_admin_can_delete_any_comment(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $post = Post::factory()->create();

        $comment = Comment::create([
            'user_id' => $user->id,
            'post_id' => $post->id,
            'body' => 'User comment',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/comments/{$comment->id}")
            ->assertOk();

        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_unauthenticated_user_cannot_mutate_social(): void
    {
        $post = Post::factory()->create();

        $this->postJson("/api/posts/{$post->id}/like")->assertUnauthorized();
        $this->deleteJson("/api/posts/{$post->id}/like")->assertUnauthorized();
        $this->postJson("/api/posts/{$post->id}/save")->assertUnauthorized();
        $this->deleteJson("/api/posts/{$post->id}/save")->assertUnauthorized();
        $this->postJson("/api/posts/{$post->id}/comments", ['body' => 'test'])->assertUnauthorized();
    }
}
