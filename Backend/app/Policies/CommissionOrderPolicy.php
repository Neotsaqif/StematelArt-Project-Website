<?php

namespace App\Policies;

use App\Enums\CommissionOrderStatus;
use App\Models\CommissionOrder;
use App\Models\User;

class CommissionOrderPolicy
{
    /**
     * Determine if the user can view commission orders.
     * - Buyer can view own orders
     * - Artist can view orders where they are the artist
     * - Admin can view all orders
     */
    public function viewAny(User $user): bool
    {
        return true; // Scoped in controller by role
    }

    /**
     * Determine if the user can view a specific commission order.
     * - Buyer can view own order
     * - Artist can view order belonging to them
     * - Admin can view any order
     */
    public function view(User $user, CommissionOrder $order): bool
    {
        return $user->role === 'admin'
            || $user->is($order->buyer)
            || $user->is($order->artist);
    }

    /**
     * Any authenticated user can create an order.
     * Business rules (active package, etc.) are enforced in the controller.
     */
    public function create(User $user): bool
    {
        return true;
    }

    public function pay(User $user, CommissionOrder $order): bool
    {
        return $user->role !== 'admin'
            && $user->id === $order->buyer_id;
    }

    public function transition(User $user, CommissionOrder $order, CommissionOrderStatus $toStatus): bool
    {
        return match ($toStatus) {
            CommissionOrderStatus::InProgress,
            CommissionOrderStatus::Delivered => $user->role === 'artist'
                && $user->id === $order->artist_id,
            CommissionOrderStatus::Completed => $user->role !== 'admin'
                && $user->id === $order->buyer_id,
            default => false,
        };
    }
}
