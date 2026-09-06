<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
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

    public function test_login_with_malformed_input_returns_validation_error(): void
    {
        $this->postJson('/api/login', [
            'email' => 'not-an-email',
        ])->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['email', 'password']]);
    }

    public function test_login_is_rate_limited_with_consistent_json_response(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ])->assertUnauthorized();
        }

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(429)
            ->assertJson([
                'success' => false,
                'message' => 'Too many login attempts. Please try again later.',
            ])
            ->assertJsonStructure(['errors']);
    }

    public function test_registration_is_rate_limited_by_ip(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/register', [
                'name' => 'Rate Limited '.$attempt,
                'email' => 'rate-limited-'.$attempt.'@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ])->assertCreated();
        }

        $this->postJson('/api/register', [
            'name' => 'Blocked Registration',
            'email' => 'blocked-registration@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(429)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['message', 'errors']);
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_logout_with_revoked_token_returns_unauthorized(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('revoked')->accessToken;
        $token->delete();

        $this->withToken($token->token)->postJson('/api/logout')->assertUnauthorized();
    }

    public function test_logout_without_a_current_bearer_token_is_safe(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_sanctum_tokens_expire_after_configured_lifetime(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('expiry-test')->accessToken;
        $token->forceFill(['expires_at' => Carbon::now()->subMinute()])->save();

        $this->withToken($token->token)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_api_server_errors_do_not_leak_exception_details(): void
    {
        Route::get('/api/test-auth-error', function () {
            throw new \RuntimeException('internal-secret-detail');
        });

        $this->getJson('/api/test-auth-error')
            ->assertStatus(500)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'An unexpected server error occurred.')
            ->assertDontSee('internal-secret-detail');
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
