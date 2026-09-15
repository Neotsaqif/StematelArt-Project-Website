<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommissionOrder;
use App\Models\EscrowTransaction;
use Illuminate\Http\Request;

class AdminEscrowController extends Controller
{
    public function transactions(Request $request)
    {
        $validated = $request->validate([
            'type' => ['sometimes', 'string', 'in:hold,release,refund'],
            'status' => ['sometimes', 'string', 'in:held,released'],
            'order_id' => ['sometimes', 'integer', 'exists:commission_orders,id'],
            'sort' => ['sometimes', 'string', 'in:created_at,updated_at,amount,status'],
            'direction' => ['sometimes', 'string', 'in:asc,desc'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = EscrowTransaction::query();

        if (isset($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (isset($validated['order_id'])) {
            $query->where('order_id', $validated['order_id']);
        }

        $sortColumn = $validated['sort'] ?? 'created_at';
        $sortDirection = $validated['direction'] ?? 'desc';
        $query->orderBy($sortColumn, $sortDirection);

        $transactions = $query
            ->with([
                'order:id,status,buyer_id,artist_id',
                'order.buyer:id,name,email,role',
                'order.artist:id,name,email,role',
            ])
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'message' => 'Escrow transactions retrieved successfully.',
            'data' => [
                'transactions' => $transactions,
            ],
        ]);
    }

    public function failed(Request $request)
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $failedStates = collect();

        // Orders that are paid but missing valid hold
        $paidWithoutHold = CommissionOrder::where('status', 'paid')
            ->whereDoesntHave('escrowTransactions', function ($query) {
                $query->where('type', 'hold')->where('status', 'held');
            })
            ->with(['buyer:id,name', 'artist:id,name'])
            ->get()
            ->map(function ($order) {
                return [
                    'order_id' => $order->id,
                    'order_status' => $order->status->value,
                    'issue' => 'missing_hold',
                    'description' => 'Order is paid but has no valid escrow hold transaction.',
                    'buyer' => $order->buyer ? $order->buyer->name : null,
                    'artist' => $order->artist ? $order->artist->name : null,
                    'amount' => $order->amount,
                    'created_at' => $order->created_at,
                ];
            });

        // Orders that are released but missing valid release
        $releasedWithoutRelease = CommissionOrder::where('status', 'released')
            ->whereDoesntHave('escrowTransactions', function ($query) {
                $query->where('type', 'release')->where('status', 'released');
            })
            ->with(['buyer:id,name', 'artist:id,name'])
            ->get()
            ->map(function ($order) {
                return [
                    'order_id' => $order->id,
                    'order_status' => $order->status->value,
                    'issue' => 'missing_release',
                    'description' => 'Order is released but has no valid escrow release transaction.',
                    'buyer' => $order->buyer ? $order->buyer->name : null,
                    'artist' => $order->artist ? $order->artist->name : null,
                    'amount' => $order->amount,
                    'created_at' => $order->created_at,
                ];
            });

        $failedStates = $paidWithoutHold->concat($releasedWithoutRelease);

        // Manual pagination since we're combining collections
        $perPage = $validated['per_page'] ?? 15;
        $page = $request->get('page', 1);
        $offset = ($page - 1) * $perPage;
        
        $paginatedItems = $failedStates->slice($offset, $perPage)->values();
        $total = $failedStates->count();

        $pagination = [
            'current_page' => $page,
            'data' => $paginatedItems,
            'first_page_url' => $request->url() . '?page=1',
            'from' => $offset + 1,
            'last_page' => ceil($total / $perPage),
            'last_page_url' => $request->url() . '?page=' . ceil($total / $perPage),
            'next_page_url' => $page < ceil($total / $perPage) ? $request->url() . '?page=' . ($page + 1) : null,
            'path' => $request->url(),
            'per_page' => $perPage,
            'prev_page_url' => $page > 1 ? $request->url() . '?page=' . ($page - 1) : null,
            'to' => min($offset + $perPage, $total),
            'total' => $total,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Failed escrow states retrieved successfully.',
            'data' => [
                'failed_states' => $pagination,
            ],
        ]);
    }
}