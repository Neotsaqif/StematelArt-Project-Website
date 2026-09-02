<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ArtworkStorageTest extends TestCase
{
    use RefreshDatabase;

    private string $disk;

    protected function setUp(): void
    {
        parent::setUp();
        $this->disk = config('filesystems.artwork_storage_disk', 'supabase');
        Storage::fake($this->disk);
    }

    public function test_artist_can_upload_artwork_with_generated_path(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);

        $response = $this->actingAs($artist, 'sanctum')->post('/api/posts', [
            'title' => 'Stored Artwork',
            'artwork' => UploadedFile::fake()->image('original-name.png'),
        ])->assertCreated();

        $path = $response->json('data.post.artwork_path');

        $this->assertMatchesRegularExpression(
            '#^artworks/'.$artist->id.'/[0-9a-f-]{36}\.png$#',
            $path
        );
        $this->assertStringNotContainsString('original-name', $path);
        Storage::disk($this->disk)->assertExists($path);
        $this->assertDatabaseHas('posts', ['artwork_path' => $path]);
    }

    public function test_admin_can_upload_but_normal_user_cannot(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user']);
        $file = UploadedFile::fake()->image('artwork.jpg');

        $this->actingAs($admin, 'sanctum')
            ->post('/api/posts', ['title' => 'Admin Artwork', 'artwork' => $file])
            ->assertCreated();

        $this->actingAs($user, 'sanctum')
            ->post('/api/posts', ['title' => 'Rejected', 'artwork' => $file])
            ->assertForbidden();
    }

    public function test_artwork_is_required_and_validated(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);

        $this->actingAs($artist, 'sanctum')
            ->post('/api/posts', ['title' => 'Missing Artwork'])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['artwork']]);

        $this->actingAs($artist, 'sanctum')
            ->post('/api/posts', [
                'title' => 'Invalid Artwork',
                'artwork' => UploadedFile::fake()->create('file.txt', 10, 'text/plain'),
            ])
            ->assertUnprocessable();

        $this->actingAs($artist, 'sanctum')
            ->post('/api/posts', [
                'title' => 'Oversized Artwork',
                'artwork' => UploadedFile::fake()->create('large.jpg', 10241, 'image/jpeg'),
            ])
            ->assertUnprocessable();
    }

    public function test_client_cannot_inject_artwork_path(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $injectedPath = 'artworks/other/arbitrary.jpg';

        $response = $this->actingAs($artist, 'sanctum')->post('/api/posts', [
            'title' => 'Safe Path',
            'artwork_path' => $injectedPath,
            'artwork' => UploadedFile::fake()->image('safe.jpg'),
        ])->assertCreated();

        $this->assertNotSame($injectedPath, $response->json('data.post.artwork_path'));
    }

    public function test_artist_can_replace_own_artwork_and_old_file_is_removed(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $create = $this->actingAs($artist, 'sanctum')->post('/api/posts', [
            'title' => 'Replace Me',
            'artwork' => UploadedFile::fake()->image('old.jpg'),
        ])->assertCreated();
        $post = Post::findOrFail($create->json('data.post.id'));
        $oldPath = $post->artwork_path;

        $update = $this->actingAs($artist, 'sanctum')->post("/api/posts/{$post->id}", [
            '_method' => 'PUT',
            'title' => 'Replaced',
            'artwork' => UploadedFile::fake()->image('new.webp'),
        ])->assertOk();
        $newPath = $update->json('data.post.artwork_path');

        $this->assertNotSame($oldPath, $newPath);
        Storage::disk($this->disk)->assertMissing($oldPath);
        Storage::disk($this->disk)->assertExists($newPath);
    }

    public function test_invalid_replacement_preserves_existing_artwork(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $create = $this->actingAs($artist, 'sanctum')->post('/api/posts', [
            'title' => 'Keep Me',
            'artwork' => UploadedFile::fake()->image('old.jpg'),
        ])->assertCreated();
        $post = Post::findOrFail($create->json('data.post.id'));
        $oldPath = $post->artwork_path;

        $this->actingAs($artist, 'sanctum')->post("/api/posts/{$post->id}", [
            '_method' => 'PUT',
            'title' => 'Invalid Replacement',
            'artwork' => UploadedFile::fake()->create('bad.txt', 10, 'text/plain'),
        ])->assertUnprocessable();

        $this->assertSame($oldPath, $post->fresh()->artwork_path);
        Storage::disk($this->disk)->assertExists($oldPath);
    }

    public function test_artist_cannot_replace_or_delete_another_artists_artwork(): void
    {
        $owner = User::factory()->create(['role' => 'artist']);
        $other = User::factory()->create(['role' => 'artist']);
        $post = $owner->posts()->create([
            'title' => 'Owned Artwork',
            'artwork_path' => 'artworks/'.$owner->id.'/trusted.jpg',
        ]);
        Storage::disk($this->disk)->put($post->artwork_path, 'content');

        $this->actingAs($other, 'sanctum')
            ->post("/api/posts/{$post->id}", [
                '_method' => 'PUT',
                'title' => 'No Access',
                'artwork' => UploadedFile::fake()->image('attempt.jpg'),
            ])->assertForbidden();
        $this->actingAs($other, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}")
            ->assertForbidden();

        Storage::disk($this->disk)->assertExists($post->artwork_path);
    }

    public function test_admin_can_replace_and_delete_another_users_artwork(): void
    {
        $owner = User::factory()->create(['role' => 'artist']);
        $admin = User::factory()->create(['role' => 'admin']);
        $post = $owner->posts()->create([
            'title' => 'Moderated Artwork',
            'artwork_path' => 'artworks/'.$owner->id.'/old.jpg',
        ]);
        Storage::disk($this->disk)->put($post->artwork_path, 'content');
        $oldPath = $post->artwork_path;

        $response = $this->actingAs($admin, 'sanctum')->post("/api/posts/{$post->id}", [
            '_method' => 'PUT',
            'title' => 'Moderated Replacement',
            'artwork' => UploadedFile::fake()->image('admin.png'),
        ])->assertOk();
        $newPath = $response->json('data.post.artwork_path');

        Storage::disk($this->disk)->assertMissing($oldPath);
        Storage::disk($this->disk)->assertExists($newPath);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}")
            ->assertOk();
        Storage::disk($this->disk)->assertMissing($newPath);
    }
}
