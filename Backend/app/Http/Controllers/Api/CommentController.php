<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Post $post): JsonResponse
    {
        $comments = $post->comments()
            ->with('user:id,name,email,role,avatar')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'comments' => $comments,
            ],
        ]);
    }

    public function store(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $comment = $post->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        $comment->load('user:id,name,email,role,avatar');

        return response()->json([
            'success' => true,
            'message' => 'Comment created successfully.',
            'data' => [
                'comment' => $comment,
            ],
        ], 201);
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        $user = $request->user();

        if ($comment->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully.',
            'data' => (object) [],
        ]);
    }
}
