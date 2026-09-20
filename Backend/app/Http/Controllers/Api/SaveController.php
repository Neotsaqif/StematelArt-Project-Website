<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Save;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaveController extends Controller
{
    public function store(Request $request, Post $post): JsonResponse
    {
        Save::firstOrCreate([
            'user_id' => $request->user()->id,
            'post_id' => $post->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Post saved successfully.',
            'data' => [
                'saved' => true,
            ],
        ], 200);
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        Save::where('user_id', $request->user()->id)
            ->where('post_id', $post->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post unsaved successfully.',
            'data' => [
                'saved' => false,
            ],
        ]);
    }
}
