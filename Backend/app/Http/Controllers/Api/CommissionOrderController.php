<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommissionOrder;
use App\Models\CommissionPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;

class CommissionOrderController extends Controller
{
    private const USER_COLUMNS = 'id,name,email,role,bio,avatar';
    private const PACKAGE_COLUMNS = 'id,artist_id,title,description,price,platform_fee_rate,delivery_time,active';

    public function index(Request $request)
    {
        Gate::authorize('viewAny', CommissionOrder::class);

        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $user = $request->user();
        $query = CommissionOrder::query();

        if ($user->role === 'admin') {
        } elseif ($user->role === 'artist') {
            $query->where('artist_id', $user->id);
        } else {
            $query->where('buyer_id', $user->id);
        }

        $orders = $query
            ->with([
                'buyer:' . self::USER_COLUMNS,
                'artist:' . self::USER_COLUMNS,
                'package:' . self::PACKAGE_COLUMNS,
            ])
            ->latest()
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
        Gate::authorize('view', $commissionOrder);

        $commissionOrder->load([
            'buyer:' . self::USER_COLUMNS,
            'artist:' . self::USER_COLUMNS,
            'package:' . self::PACKAGE_COLUMNS,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Commission order retrieved successfully.',
            'data' => [
                'order' => $commissionOrder,
            ],
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', CommissionOrder::class);

        $validated = $request->validate([
            'package_id'      => ['required', 'integer', 'exists:commission_packages,id'],
            'brief'           => ['required', 'string', 'max:5000'],
            'reference_image' => ['nullable', 'string', 'max:500'],
            'deadline_at'     => ['nullable', 'date', 'after:now'],
        ]);

        $package = CommissionPackage::findOrFail($validated['package_id']);

        if (!$package->active) {
            return response()->json([
                'success' => false,
                'message' => 'The selected package is not available.',
                'errors' => [
                    'package_id' => ['The selected package is not active.'],
                ],
            ], 422);
        }

        $amount = $package->price;
        $platformFeeAmount = (int) round($amount * $package->platform_fee_rate);
        $artistPayoutAmount = $amount - $platformFeeAmount;

        $order = DB::transaction(function () use ($request, $package, $validated, $amount, $platformFeeAmount, $artistPayoutAmount) {
            $order = new CommissionOrder();
            $order->package_id = $package->id;
            $order->buyer_id = $request->user()->id;
            $order->artist_id = $package->artist_id;
            $order->amount = $amount;
            $order->platform_fee_amount = $platformFeeAmount;
            $order->artist_payout_amount = $artistPayoutAmount;
            $order->brief = $validated['brief'];
            $order->reference_image = $validated['reference_image'] ?? null;
            $order->deadline_at = $validated['deadline_at'] ?? null;
            $order->status = 'pending_payment';
            $order->save();

            return $order;
        });

        $order->load([
            'buyer:' . self::USER_COLUMNS,
            'artist:' . self::USER_COLUMNS,
            'package:' . self::PACKAGE_COLUMNS,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Commission order created successfully.',
            'data' => [
                'order' => $order,
            ],
        ], 201);
    }
}
