<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function store(Request $request, Post $post): JsonResponse
    {
        Like::firstOrCreate([
            'user_id' => $request->user()->id,
            'post_id' => $post->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Post liked successfully.',
            'data' => [
                'liked' => true,
            ],
        ], 200);
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        Like::where('user_id', $request->user()->id)
            ->where('post_id', $post->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post unliked successfully.',
            'data' => [
                'liked' => false,
            ],
        ]);
    }
}
