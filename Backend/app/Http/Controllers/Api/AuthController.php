<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        [$user, $token] = DB::transaction(function () use ($validated): array {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'user',
            ]);

            return [$user, $user->createToken('auth_token')->plainTextToken];
        });

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.',
                'errors' => (object) [],
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

}
