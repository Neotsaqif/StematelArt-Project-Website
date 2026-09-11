<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CommissionPackageController;
use App\Http\Controllers\Api\CommissionOrderController;

Route::middleware('throttle:auth-register')
    ->post('/register', [AuthController::class, 'register']);

Route::middleware('throttle:auth-login')
    ->post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return response()->json([
        'success' => true,
        'data' => [
            'user' => $request->user(),
        ],
    ]);
});

Route::middleware(['auth:sanctum', 'role:admin'])
    ->get('/admin/test', function () {
        return response()->json([
            'success' => true,
            'message' => 'Admin authorization successful.',
        ]);
    });

Route::middleware(['auth:sanctum', 'role:artist'])
    ->get('/artist/test', function () {
        return response()->json([
            'success' => true,
            'message' => 'Artist authorization successful.',
        ]);
    });



Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::post('/users/{user}/follow', [FollowController::class, 'store']);
    Route::delete('/users/{user}/follow', [FollowController::class, 'destroy']);
    Route::get('/users/{user}/followers', [FollowController::class, 'followers']);
    Route::get('/users/{user}/following', [FollowController::class, 'following']);
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/posts/{post}', [PostController::class, 'show']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{post}', [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    // Commission Packages — read (any authenticated user)
    Route::get('/commission/packages', [CommissionPackageController::class, 'index']);
    Route::get('/commission/packages/{commissionPackage}', [CommissionPackageController::class, 'show']);

    // Commission Packages — write (artist or admin only, enforced by policy)
    Route::post('/artist/commission/packages', [CommissionPackageController::class, 'store']);
    Route::put('/artist/commission/packages/{commissionPackage}', [CommissionPackageController::class, 'update']);
    Route::delete('/artist/commission/packages/{commissionPackage}', [CommissionPackageController::class, 'destroy']);

    // Commission Orders — authenticated users
    Route::get('/commission/orders', [CommissionOrderController::class, 'index']);
    Route::get('/commission/orders/{commissionOrder}', [CommissionOrderController::class, 'show']);
    Route::post('/commission/orders', [CommissionOrderController::class, 'store']);
    Route::post('/commission/orders/{commissionOrder}/payment', [CommissionOrderController::class, 'payment']);
    Route::post('/commission/orders/{commissionOrder}/start', [CommissionOrderController::class, 'start']);
    Route::post('/commission/orders/{commissionOrder}/deliver', [CommissionOrderController::class, 'deliver']);
    Route::post('/commission/orders/{commissionOrder}/complete', [CommissionOrderController::class, 'complete']);
});
