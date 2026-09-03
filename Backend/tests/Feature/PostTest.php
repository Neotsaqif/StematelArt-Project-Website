<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->fakeArtworkStorage();
    }

    public function test_unauthenticated_user_cannot_list_or_view_posts(): void
    {
        $post = $this->createPost(User::factory()->create(['role' => 'artist']));

        $this->getJson('/api/posts')->assertUnauthorized();
        $this->getJson("/api/posts/{$post->id}")->assertUnauthorized();
    }

    public function test_authenticated_user_can_list_and_view_posts(): void
    {
        $author = User::factory()->create(['role' => 'artist']);
        $post = $this->createPost($author);
        $viewer = User::factory()->create(['role' => 'user']);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/posts')
            ->assertOk()
            ->assertJsonPath('data.posts.data.0.id', $post->id)
            ->assertJsonPath('data.posts.data.0.user.id', $author->id);

        $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('data.post.id', $post->id)
            ->assertJsonPath('data.post.user.id', $author->id);
    }

    public function test_user_cannot_create_update_or_delete_posts(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $post = $this->createPost(User::factory()->create(['role' => 'artist']));

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/posts', ['title' => 'Not allowed'])
            ->assertForbidden();
        $this->actingAs($user, 'sanctum')
            ->putJson("/api/posts/{$post->id}", ['title' => 'Not allowed'])
            ->assertForbidden();
        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}")
            ->assertForbidden();
    }

    public function test_artist_can_create_post_and_owner_comes_from_authenticated_user(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $otherArtist = User::factory()->create(['role' => 'artist']);
        $this->fakeArtworkStorage();

        $response = $this->actingAs($artist, 'sanctum')
            ->post('/api/posts', [
                'user_id' => $otherArtist->id,
                'role' => 'admin',
                'title' => 'First Artwork',
                'description' => 'A description.',
                'tags' => 'watercolor, nature',
                'artwork' => UploadedFile::fake()->image('first.jpg'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.post.user_id', $artist->id);

        $this->assertDatabaseHas('posts', [
            'id' => $response->json('data.post.id'),
            'user_id' => $artist->id,
        ]);
        $this->assertDatabaseMissing('posts', [
            'user_id' => $otherArtist->id,
            'title' => 'First Artwork',
        ]);
    }

    public function test_admin_can_create_post(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->fakeArtworkStorage();

        $this->actingAs($admin, 'sanctum')
            ->post('/api/posts', [
                'title' => 'Admin Artwork',
                'artwork' => UploadedFile::fake()->image('admin.jpg'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.post.user_id', $admin->id);
    }

    public function test_artist_can_update_and_delete_own_post(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $post = $this->createPost($artist);

        $this->actingAs($artist, 'sanctum')
            ->putJson("/api/posts/{$post->id}", [
                'title' => 'Updated Artwork',
                'description' => 'Updated description.',
            ])
            ->assertOk()
            ->assertJsonPath('data.post.title', 'Updated Artwork');

        $this->actingAs($artist, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('data', []);

        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    public function test_artist_cannot_update_or_delete_another_artists_post(): void
    {
        $artistA = User::factory()->create(['role' => 'artist']);
        $artistB = User::factory()->create(['role' => 'artist']);
        $post = $this->createPost($artistB);

        $this->actingAs($artistA, 'sanctum')
            ->putJson("/api/posts/{$post->id}", ['title' => 'Unauthorized'])
            ->assertForbidden();
        $this->actingAs($artistA, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}")
            ->assertForbidden();
    }

    public function test_admin_can_update_and_delete_another_users_post(): void
    {
        $author = User::factory()->create(['role' => 'artist']);
        $admin = User::factory()->create(['role' => 'admin']);
        $post = $this->createPost($author);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/posts/{$post->id}", ['title' => 'Moderated Artwork'])
            ->assertOk()
            ->assertJsonPath('data.post.title', 'Moderated Artwork');
        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}")
            ->assertOk();

        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    public function test_post_validation_applies_to_create_and_update(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $post = $this->createPost($artist);

        $this->actingAs($artist, 'sanctum')
            ->post('/api/posts', [
                'description' => str_repeat('x', 5001),
                'tags' => str_repeat('x', 1001),
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['title', 'description', 'artwork']]);

        $this->actingAs($artist, 'sanctum')
            ->putJson("/api/posts/{$post->id}", [
                'title' => str_repeat('x', 256),
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['title']]);
    }

    public function test_post_list_is_paginated_and_limits_page_size(): void
    {
        $author = User::factory()->create(['role' => 'artist']);
        for ($index = 0; $index < 16; $index++) {
            $this->createPost($author, ['title' => "Artwork {$index}"]);
        }

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/posts')
            ->assertOk()
            ->assertJsonPath('data.posts.per_page', 15)
            ->assertJsonCount(15, 'data.posts.data');

        $this->actingAs($author, 'sanctum')
            ->getJson('/api/posts?per_page=51')
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['per_page']]);
    }

    public function test_post_author_response_hides_sensitive_user_fields(): void
    {
        $post = $this->createPost(User::factory()->create(['role' => 'artist']));
        $viewer = User::factory()->create();

        $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/posts/{$post->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.post.user.password')
            ->assertJsonMissingPath('data.post.user.remember_token')
            ->assertJsonMissingPath('data.post.user.tokens');
    }

    public function test_user_and_post_relationships_return_the_correct_records(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $post = $this->createPost($artist);

        $this->assertTrue($artist->posts->contains($post));
        $this->assertTrue($post->user->is($artist));
    }

    public function test_delete_user_cascades_posts(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $post = $this->createPost($artist);

        $artist->delete();

        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    public function test_missing_post_returns_standard_api_not_found(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/posts/999999')
            ->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Resource not found.');
    }

    private function createPost(User $author, array $attributes = []): Post
    {
        return $author->posts()->create(array_merge([
            'title' => 'Test Artwork',
            'description' => 'Test description.',
            'tags' => 'test',
            'artwork_path' => 'artworks/test.jpg',
        ], $attributes));
    }

    private function fakeArtworkStorage(): void
    {
        Storage::fake(config('filesystems.artwork_storage_disk', 'supabase'));
    }
}
