<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_retrieve_own_profile_without_sensitive_fields(): void
    {
        $user = User::factory()->create([
            'bio' => 'A young artist.',
            'avatar' => 'avatars/existing.jpg',
        ]);
        $user->createToken('profile-test');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.bio', 'A young artist.')
            ->assertJsonPath('data.user.avatar', 'avatars/existing.jpg')
            ->assertJsonMissingPath('data.user.password')
            ->assertJsonMissingPath('data.user.remember_token')
            ->assertJsonMissingPath('data.user.tokens');
    }

    public function test_unauthenticated_user_cannot_access_profile_endpoints(): void
    {
        $this->getJson('/api/profile')->assertUnauthorized();
        $this->putJson('/api/profile', ['name' => 'Blocked'])->assertUnauthorized();
        $this->postJson('/api/profile/avatar')->assertUnauthorized();
    }

    public function test_authenticated_user_can_update_name_and_bio(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/profile', [
                'name' => 'Updated Artist',
                'bio' => 'Updated biography.',
            ])
            ->assertOk()
            ->assertJsonPath('data.user.name', 'Updated Artist')
            ->assertJsonPath('data.user.bio', 'Updated biography.');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Artist',
            'bio' => 'Updated biography.',
        ]);
    }

    public function test_profile_update_validates_name_and_bio(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/profile', [
                'name' => str_repeat('x', 256),
                'bio' => str_repeat('x', 5001),
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['name', 'bio']]);
    }

    public function test_profile_update_cannot_escalate_role_or_change_email(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'email' => 'original@example.com',
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/profile', [
                'name' => 'Safe Update',
                'bio' => 'Safe bio.',
                'role' => 'admin',
                'email' => 'changed@example.com',
                'password' => 'new-password',
            ])
            ->assertOk()
            ->assertJsonPath('data.user.role', 'user')
            ->assertJsonPath('data.user.email', 'original@example.com');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'user',
            'email' => 'original@example.com',
        ]);
    }

    public function test_authenticated_user_can_upload_valid_avatar(): void
    {
        $avatarDisk = config('filesystems.profile_avatar_disk', 'public');
        Storage::fake($avatarDisk);
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->post('/api/profile/avatar', [
                'avatar' => UploadedFile::fake()->image('profile.jpg'),
            ])
            ->assertOk()
            ->assertJsonPath('data.user.avatar', fn ($avatar) => str_starts_with($avatar, 'avatars/'));

        $user->refresh();
        $this->assertNotEmpty($user->avatar);
        Storage::disk($avatarDisk)->assertExists($user->avatar);
    }

    public function test_avatar_rejects_invalid_file_type(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->post('/api/profile/avatar', [
                'avatar' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['avatar']]);
    }

    public function test_avatar_rejects_files_over_five_megabytes(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->post('/api/profile/avatar', [
                'avatar' => UploadedFile::fake()->create('large.jpg', 5121, 'image/jpeg'),
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['avatar']]);
    }

    public function test_new_avatar_replaces_old_avatar_after_success(): void
    {
        $avatarDisk = config('filesystems.profile_avatar_disk', 'public');
        Storage::fake($avatarDisk);
        $oldAvatar = 'avatars/old.jpg';
        Storage::disk($avatarDisk)->put($oldAvatar, 'old avatar');
        $user = User::factory()->create(['avatar' => $oldAvatar]);

        $this->actingAs($user, 'sanctum')
            ->post('/api/profile/avatar', [
                'avatar' => UploadedFile::fake()->image('new.jpg'),
            ])
            ->assertOk();

        $user->refresh();
        Storage::disk($avatarDisk)->assertMissing($oldAvatar);
        Storage::disk($avatarDisk)->assertExists($user->avatar);
    }

    public function test_settings_are_created_with_defaults(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/settings')
            ->assertOk()
            ->assertJsonPath('data.settings.theme', 'light')
            ->assertJsonPath('data.settings.notifications_enabled', true);
    }

    public function test_settings_can_be_updated(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/settings', [
                'theme' => 'dark',
                'notifications_enabled' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.settings.theme', 'dark')
            ->assertJsonPath('data.settings.notifications_enabled', false);
    }

    public function test_settings_validate_theme_and_notification_preference(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/settings', [
                'theme' => 'blue',
                'notifications_enabled' => 'not-a-boolean',
            ])
            ->assertUnprocessable()
            ->assertJsonStructure([
                'errors' => ['theme', 'notifications_enabled'],
            ]);
    }

    public function test_settings_cannot_be_used_to_change_role(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/settings', [
                'theme' => 'dark',
                'role' => 'admin',
            ])
            ->assertOk();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'user',
        ]);
    }
}
