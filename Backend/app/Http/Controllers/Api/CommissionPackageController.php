<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommissionPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CommissionPackageController extends Controller
{
    /**
     * Columns to select when eager-loading the artist.
     * Deliberately excludes password, remember_token, tokens.
     */
    private const ARTIST_COLUMNS = 'id,name,email,role,bio,avatar';

    /**
     * List active commission packages, paginated.
     * Accessible by any authenticated user.
     */
    public function index(Request $request)
    {
        Gate::authorize('view', CommissionPackage::class);

        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $packages = CommissionPackage::query()
            ->where('active', true)
            ->with('artist:' . self::ARTIST_COLUMNS)
            ->latest()
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'message' => 'Commission packages retrieved successfully.',
            'data' => [
                'packages' => $packages,
            ],
        ]);
    }

    /**
     * Show a specific commission package.
     * Accessible by any authenticated user.
     */
    public function show(CommissionPackage $commissionPackage)
    {
        Gate::authorize('view', CommissionPackage::class);
        $commissionPackage->load('artist:' . self::ARTIST_COLUMNS);

        return response()->json([
            'success' => true,
            'message' => 'Commission package retrieved successfully.',
            'data' => [
                'package' => $commissionPackage,
            ],
        ]);
    }

    /**
     * Create a new commission package.
     * Only artist or admin can create.
     * artist_id is ALWAYS set from the authenticated user — never from the request.
     */
    public function store(Request $request)
    {
        Gate::authorize('create', CommissionPackage::class);

        $validated = $request->validate($this->packageRules());

        $package = $request->user()->commissionPackages()->create($validated);
        $package->load('artist:' . self::ARTIST_COLUMNS);

        return response()->json([
            'success' => true,
            'message' => 'Commission package created successfully.',
            'data' => [
                'package' => $package,
            ],
        ], 201);
    }

    /**
     * Update an existing commission package.
     * Only the owner artist or admin can update.
     * Ownership reassignment is never permitted.
     */
    public function update(Request $request, CommissionPackage $commissionPackage)
    {
        Gate::authorize('update', $commissionPackage);

        $validated = $request->validate($this->packageRules(false));

        $commissionPackage->update($validated);
        $commissionPackage->load('artist:' . self::ARTIST_COLUMNS);

        return response()->json([
            'success' => true,
            'message' => 'Commission package updated successfully.',
            'data' => [
                'package' => $commissionPackage,
            ],
        ]);
    }

    /**
     * Deactivate (soft-delete) a commission package.
     * Sets active = false instead of destroying the record,
     * preserving history for future order references.
     * Only the owner artist or admin can deactivate.
     */
    public function destroy(CommissionPackage $commissionPackage)
    {
        Gate::authorize('delete', $commissionPackage);

        $commissionPackage->update(['active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Commission package deactivated successfully.',
            'data' => (object) [],
        ]);
    }

    /**
     * Shared validation rules for create and update.
     *
     * @param bool $allRequired  When true (create), title/price/platform_fee_rate/delivery_time are required.
     *                           When false (update), all fields are optional (partial update).
     */
    private function packageRules(bool $allRequired = true): array
    {
        $presence = $allRequired ? 'required' : 'sometimes';

        return [
            'title'             => [$presence, 'string', 'max:255'],
            'description'       => ['nullable', 'string', 'max:5000'],
            'price'             => [$presence, 'integer', 'min:0'],
            'platform_fee_rate' => [$presence, 'numeric', 'min:0', 'max:1'],
            'delivery_time'     => [$presence, 'integer', 'min:1'],
            'terms'             => ['nullable', 'string', 'max:5000'],
            'active'            => ['sometimes', 'boolean'],
        ];
    }
}
