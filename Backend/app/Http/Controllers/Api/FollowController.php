<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    public function store(Request $request, User $user)
    {
        $follower = $request->user();

        if ($follower->is($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot follow yourself.',
                'errors' => (object) [],
            ], 422);
        }

        if (Follow::where('follower_id', $follower->id)
            ->where('following_id', $user->id)
            ->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Already following this user.',
                'errors' => (object) [],
            ], 409);
        }

        try {
            Follow::create([
                'follower_id' => $follower->id,
                'following_id' => $user->id,
            ]);
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'success' => false,
                'message' => 'Already following this user.',
                'errors' => (object) [],
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'User followed successfully.',
            'data' => [
                'following' => true,
            ],
        ], 201);
    }

    public function destroy(Request $request, User $user)
    {
        $deleted = Follow::where('follower_id', $request->user()->id)
            ->where('following_id', $user->id)
            ->delete();

        if ($deleted === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Follow relationship not found.',
                'errors' => (object) [],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'User unfollowed successfully.',
            'data' => [
                'following' => false,
            ],
        ]);
    }

    public function followers(Request $request, User $user)
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $followers = $user->followers()->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $followers,
            ],
        ]);
    }

    public function following(Request $request, User $user)
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $following = $user->following()->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $following,
            ],
        ]);
    }
}
