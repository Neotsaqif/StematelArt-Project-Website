<?php

namespace App\Http\Controllers\Api;

use App\Enums\CommissionOrderStatus;
use App\Http\Controllers\Controller;
use App\Models\CommissionOrder;
use Illuminate\Http\Request;

class AdminCommissionOrderController extends Controller
{
    private const USER_COLUMNS = 'id,name,email,role,bio,avatar';
    private const PACKAGE_COLUMNS = 'id,artist_id,title,description,price,platform_fee_rate,delivery_time,active';

    public function index(Request $request)
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:pending_payment,paid,in_progress,delivered,completed,released,expired,cancelled'],
            'buyer_id' => ['sometimes', 'integer', 'exists:users,id'],
            'artist_id' => ['sometimes', 'integer', 'exists:users,id'],
            'sort' => ['sometimes', 'string', 'in:created_at,updated_at,amount,status'],
            'direction' => ['sometimes', 'string', 'in:asc,desc'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = CommissionOrder::query();

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (isset($validated['buyer_id'])) {
            $query->where('buyer_id', $validated['buyer_id']);
        }

        if (isset($validated['artist_id'])) {
            $query->where('artist_id', $validated['artist_id']);
        }

        $sortColumn = $validated['sort'] ?? 'created_at';
        $sortDirection = $validated['direction'] ?? 'desc';
        $query->orderBy($sortColumn, $sortDirection);

        $orders = $query
            ->with([
                'buyer:' . self::USER_COLUMNS,
                'artist:' . self::USER_COLUMNS,
                'package:' . self::PACKAGE_COLUMNS,
                'escrowTransactions:id,order_id,type,amount,status,created_at',
            ])
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'message' => 'Commission orders retrieved successfully.',
            'data' => [
                'orders' => $orders,
            ],
        ]);
    }

    public function show(CommissionOrder $commissionOrder)
    {
        $commissionOrder->load([
            'buyer:' . self::USER_COLUMNS,
            'artist:' . self::USER_COLUMNS,
            'package:' . self::PACKAGE_COLUMNS,
            'escrowTransactions',
            'statusHistory.actor:id,name,email,role',
        ]);

        $consistency = $this->checkEscrowConsistency($commissionOrder);

        $data = $commissionOrder->toArray();
        $data['escrow_consistency'] = $consistency;

        return response()->json([
            'success' => true,
            'message' => 'Commission order retrieved successfully.',
            'data' => [
                'order' => $data,
            ],
        ]);
    }

    private function checkEscrowConsistency(CommissionOrder $order): array
    {
        $issues = [];

        if ($order->status === CommissionOrderStatus::Paid) {
            $hasValidHold = $order->escrowTransactions()
                ->where('type', 'hold')
                ->where('status', 'held')
                ->exists();

            if (!$hasValidHold) {
                $issues[] = 'Order is paid but has no valid escrow hold.';
            }
        }

        if ($order->status === CommissionOrderStatus::Released) {
            $hasValidRelease = $order->escrowTransactions()
                ->where('type', 'release')
                ->where('status', 'released')
                ->exists();

            if (!$hasValidRelease) {
                $issues[] = 'Order is released but has no valid escrow release.';
            }
        }

        return [
            'valid' => empty($issues),
            'issues' => $issues,
        ];
    }
}
