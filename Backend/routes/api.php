<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SettingsController;

Route::post('/register', [AuthController::class, 'register']);

Route::post('/login', [AuthController::class, 'login']);

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
});
