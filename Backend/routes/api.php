<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

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
