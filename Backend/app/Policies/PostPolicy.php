<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function view(User $user, Post $post): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['artist', 'admin'], true);
    }

    public function update(User $user, Post $post): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'artist' && $user->is($post->user));
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'artist' && $user->is($post->user));
    }
}
