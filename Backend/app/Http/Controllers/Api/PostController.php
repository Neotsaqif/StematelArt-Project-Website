<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller
{
    private const AUTHOR_COLUMNS = 'id,name,email,role,bio,avatar';

    public function index(Request $request)
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $posts = Post::query()
            ->with('user:'.self::AUTHOR_COLUMNS)
            ->latest()
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'data' => [
                'posts' => $posts,
            ],
        ]);
    }

    public function show(Post $post)
    {
        Gate::authorize('view', $post);
        $post->load('user:'.self::AUTHOR_COLUMNS);

        return response()->json([
            'success' => true,
            'data' => [
                'post' => $post,
            ],
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', Post::class);

        $validated = $this->validatedPostData($request);
        $post = $request->user()->posts()->create($validated);
        $post->load('user:'.self::AUTHOR_COLUMNS);

        return response()->json([
            'success' => true,
            'message' => 'Post created successfully.',
            'data' => [
                'post' => $post,
            ],
        ], 201);
    }

    public function update(Request $request, Post $post)
    {
        Gate::authorize('update', $post);

        $post->update($this->validatedPostData($request));
        $post->load('user:'.self::AUTHOR_COLUMNS);

        return response()->json([
            'success' => true,
            'message' => 'Post updated successfully.',
            'data' => [
                'post' => $post,
            ],
        ]);
    }

    public function destroy(Post $post)
    {
        Gate::authorize('delete', $post);
        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully.',
            'data' => (object) [],
        ]);
    }

    private function validatedPostData(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'tags' => ['nullable', 'string', 'max:1000'],
            'artwork_path' => ['nullable', 'string', 'max:2048'],
        ]);
    }
}
