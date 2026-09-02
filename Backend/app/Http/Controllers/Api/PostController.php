<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use App\Services\ArtworkStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Throwable;

class PostController extends Controller
{
    private const AUTHOR_COLUMNS = 'id,name,email,role,bio,avatar';

    public function __construct(
        private readonly ArtworkStorageService $artworkStorage
    ) {
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $posts = Post::query()
            ->with('user:'.self::AUTHOR_COLUMNS)
            ->latest()
            ->paginate($validated['per_page'] ?? 15);
        $posts->through(fn (Post $post) => $this->addArtworkUrl($post));

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
                'post' => $this->addArtworkUrl($post),
            ],
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', Post::class);

        $validated = $request->validate($this->postRules(true));
        $artwork = $validated['artwork'];
        unset($validated['artwork']);
        $artworkPath = null;

        try {
            $artworkPath = $this->artworkStorage->store($artwork, $request->user()->id);
            $post = $request->user()->posts()->create([
                ...$validated,
                'artwork_path' => $artworkPath,
            ]);
        } catch (Throwable $exception) {
            if ($artworkPath && !$this->artworkStorage->delete($artworkPath)) {
                Log::warning('Unable to clean up artwork after post creation failure.', [
                    'path' => $artworkPath,
                ]);
            }

            throw $exception;
        }

        $post->load('user:'.self::AUTHOR_COLUMNS);

        return response()->json([
            'success' => true,
            'message' => 'Post created successfully.',
            'data' => [
                'post' => $this->addArtworkUrl($post),
            ],
        ], 201);
    }

    public function update(Request $request, Post $post)
    {
        Gate::authorize('update', $post);

        $validated = $request->validate($this->postRules(false));
        $newArtworkPath = null;
        $oldArtworkPath = $post->artwork_path;

        if (isset($validated['artwork'])) {
            $newArtworkPath = $this->artworkStorage->store(
                $validated['artwork'],
                $request->user()->id
            );
            unset($validated['artwork']);
        }

        try {
            $post->update([
                ...$validated,
                ...($newArtworkPath ? ['artwork_path' => $newArtworkPath] : []),
            ]);
        } catch (Throwable $exception) {
            if ($newArtworkPath && !$this->artworkStorage->delete($newArtworkPath)) {
                Log::warning('Unable to clean up artwork after post update failure.', [
                    'post_id' => $post->id,
                    'path' => $newArtworkPath,
                ]);
            }

            throw $exception;
        }

        if ($newArtworkPath && $oldArtworkPath && $oldArtworkPath !== $newArtworkPath
            && !$this->artworkStorage->delete($oldArtworkPath)) {
            Log::warning('Unable to clean up replaced artwork.', [
                'post_id' => $post->id,
                'path' => $oldArtworkPath,
            ]);
        }

        $post->load('user:'.self::AUTHOR_COLUMNS);

        return response()->json([
            'success' => true,
            'message' => 'Post updated successfully.',
            'data' => [
                'post' => $this->addArtworkUrl($post),
            ],
        ]);
    }

    public function destroy(Post $post)
    {
        Gate::authorize('delete', $post);
        $artworkPath = $post->artwork_path;
        $post->delete();

        if ($artworkPath && !$this->artworkStorage->delete($artworkPath)) {
            Log::warning('Unable to clean up deleted post artwork.', [
                'post_id' => $post->id,
                'path' => $artworkPath,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully.',
            'data' => (object) [],
        ]);
    }

    private function postRules(bool $artworkRequired): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'tags' => ['nullable', 'string', 'max:1000'],
            'artwork' => [
                $artworkRequired ? 'required' : 'sometimes',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:10240',
            ],
        ];
    }

    private function addArtworkUrl(Post $post): Post
    {
        $post->setAttribute(
            'artwork_url',
            $post->artwork_path
                ? $this->artworkStorage->temporaryUrl($post->artwork_path)
                : null
        );

        return $post;
    }
}
