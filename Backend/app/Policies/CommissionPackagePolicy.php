<?php

namespace App\Policies;

use App\Models\CommissionPackage;
use App\Models\User;

class CommissionPackagePolicy
{
    /**
     * Any authenticated user can view commission packages.
     */
    public function view(User $user): bool
    {
        return true;
    }

    /**
     * Only artist or admin can create a commission package.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['artist', 'admin'], true);
    }

    /**
     * Owner artist or admin can update a package.
     * Do not trust artist_id or role from the request; use authenticated user.
     */
    public function update(User $user, CommissionPackage $package): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'artist' && $user->is($package->artist));
    }

    /**
     * Owner artist or admin can delete/deactivate a package.
     */
    public function delete(User $user, CommissionPackage $package): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'artist' && $user->is($package->artist));
    }
}
