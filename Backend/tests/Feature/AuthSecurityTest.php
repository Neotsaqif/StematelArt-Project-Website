<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_with_user_role(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New User',
            'email' => 'new-user@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.role', 'user')
            ->assertJsonMissingPath('data.user.password');
    }

    public function test_registration_ignores_role_injection(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Injected User',
            'email' => 'injected@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ]);

        $response->assertCreated()->assertJsonPath('data.user.role', 'user');
        $this->assertDatabaseHas('users', [
            'email' => 'injected@example.com',
            'role' => 'user',
        ]);
    }

    public function test_registration_validation_returns_consistent_json(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Invalid User',
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'different',
        ])->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'The given data was invalid.',
            ])
            ->assertJsonStructure(['errors' => ['email', 'password']]);
    }

    public function test_duplicate_registration_returns_validation_error(): void
    {
        User::factory()->create(['email' => 'duplicate@example.com']);

        $this->postJson('/api/register', [
            'name' => 'Duplicate User',
            'email' => 'duplicate@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['email']]);
    }

    public function test_user_can_login_and_access_protected_route(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk();

        $token = $login->json('data.token');

        $this->withToken($token)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonMissingPath('data.user.password');
    }

    public function test_invalid_login_returns_unauthorized(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Email atau password salah.',
            ]);
    }

    public function test_protected_routes_reject_missing_and_invalid_tokens(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
        $this->withToken('invalid-token')->getJson('/api/user')->assertUnauthorized();
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_role_endpoints_enforce_authorization(): void
    {
        $this->getJson('/api/admin/test')->assertUnauthorized();

        $user = User::factory()->create(['role' => 'user']);
        $artist = User::factory()->create(['role' => 'artist']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($user, 'sanctum')->getJson('/api/admin/test')->assertForbidden();
        $this->actingAs($artist, 'sanctum')->getJson('/api/artist/test')->assertOk();
        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/test')->assertOk();
    }

    public function test_missing_api_resource_returns_consistent_json(): void
    {
        $this->getJson('/api/does-not-exist')
            ->assertNotFound()
            ->assertJson([
                'success' => false,
                'message' => 'Resource not found.',
            ])
            ->assertJsonStructure(['errors']);
    }
}
