<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ArtworkWatermarkTest extends TestCase
{
    use RefreshDatabase;

    private string $disk;

    protected function setUp(): void
    {
        parent::setUp();
        $this->disk = config('filesystems.artwork_storage_disk', 'supabase');
        Storage::fake($this->disk);
    }

    public function test_artist_upload_stores_a_changed_valid_watermarked_image(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $file = UploadedFile::fake()->image('original.jpg', 400, 300);
        $original = file_get_contents($file->getRealPath());

        $response = $this->actingAs($artist, 'sanctum')->post('/api/posts', [
            'title' => 'Watermarked Artwork',
            'artwork' => $file,
        ])->assertCreated();

        $path = $response->json('data.post.artwork_path');
        $processed = Storage::disk($this->disk)->get($path);

        $this->assertNotSame($original, $processed);
        $this->assertNotFalse(@getimagesizefromstring($processed));
        $this->assertStringContainsString('/'.$artist->id.'/', '/'.$path.'/');
        $this->assertStringNotContainsString('original', $path);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('supportedFormats')]
    public function test_supported_image_formats_are_preserved(string $filename, string $extension): void
    {
        $artist = User::factory()->create(['role' => 'artist']);

        $response = $this->actingAs($artist, 'sanctum')->post('/api/posts', [
            'title' => 'Format '.$extension,
            'artwork' => UploadedFile::fake()->image($filename, 200, 200),
        ])->assertCreated();

        $path = $response->json('data.post.artwork_path');
        $this->assertStringEndsWith('.'.$extension, $path);
        $this->assertNotEmpty(Storage::disk($this->disk)->get($path));
    }

    public static function supportedFormats(): array
    {
        return [
            'jpeg' => ['artwork.jpg', 'jpg'],
            'png' => ['artwork.png', 'png'],
            'webp' => ['artwork.webp', 'webp'],
        ];
    }

    public function test_normal_user_cannot_trigger_watermark_upload(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($user, 'sanctum')
            ->post('/api/posts', [
                'title' => 'Rejected',
                'artwork' => UploadedFile::fake()->image('rejected.jpg'),
            ])->assertForbidden();

        $this->assertSame([], Storage::disk($this->disk)->allFiles());
    }

    public function test_malformed_image_is_rejected_without_storage(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);

        $this->actingAs($artist, 'sanctum')
            ->post('/api/posts', [
                'title' => 'Malformed',
                'artwork' => UploadedFile::fake()->createWithContent('fake.jpg', 'not-an-image'),
            ])->assertUnprocessable();

        $this->assertDatabaseCount('posts', 0);
        $this->assertSame([], Storage::disk($this->disk)->allFiles());
    }

    public function test_failed_replacement_preserves_old_watermarked_artwork(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $create = $this->actingAs($artist, 'sanctum')->post('/api/posts', [
            'title' => 'Original',
            'artwork' => UploadedFile::fake()->image('original.png'),
        ])->assertCreated();
        $post = Post::findOrFail($create->json('data.post.id'));
        $oldPath = $post->artwork_path;

        $this->actingAs($artist, 'sanctum')
            ->post("/api/posts/{$post->id}", [
                '_method' => 'PUT',
                'title' => 'Failed Replacement',
                'artwork' => UploadedFile::fake()->createWithContent('broken.png', 'not-an-image'),
            ])->assertUnprocessable();

        $this->assertSame($oldPath, $post->fresh()->artwork_path);
        Storage::disk($this->disk)->assertExists($oldPath);
        $this->assertCount(1, Storage::disk($this->disk)->allFiles());
    }

    public function test_successful_replacement_watermarks_new_artwork_before_old_cleanup(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $create = $this->actingAs($artist, 'sanctum')->post('/api/posts', [
            'title' => 'Original',
            'artwork' => UploadedFile::fake()->image('original.jpg'),
        ])->assertCreated();
        $post = Post::findOrFail($create->json('data.post.id'));
        $oldPath = $post->artwork_path;

        $response = $this->actingAs($artist, 'sanctum')
            ->post("/api/posts/{$post->id}", [
                '_method' => 'PUT',
                'title' => 'Replaced',
                'artwork' => UploadedFile::fake()->image('replacement.jpg'),
            ])->assertOk();

        $newPath = $response->json('data.post.artwork_path');
        $this->assertNotSame($oldPath, $newPath);
        Storage::disk($this->disk)->assertMissing($oldPath);
        Storage::disk($this->disk)->assertExists($newPath);
        $this->assertNotFalse(@getimagesizefromstring(Storage::disk($this->disk)->get($newPath)));
    }

    public function test_delete_removes_final_watermarked_artwork(): void
    {
        $artist = User::factory()->create(['role' => 'artist']);
        $create = $this->actingAs($artist, 'sanctum')->post('/api/posts', [
            'title' => 'Delete Me',
            'artwork' => UploadedFile::fake()->image('delete.jpg'),
        ])->assertCreated();
        $post = Post::findOrFail($create->json('data.post.id'));
        $path = $post->artwork_path;

        $this->actingAs($artist, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}")
            ->assertOk();

        Storage::disk($this->disk)->assertMissing($path);
    }
}
