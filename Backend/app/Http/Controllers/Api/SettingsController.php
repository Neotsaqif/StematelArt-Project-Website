<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show(Request $request)
    {
        $settings = $request->user()->settings()->firstOrCreate([], [
            'theme' => 'light',
            'notifications_enabled' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'settings' => $settings,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'theme' => ['sometimes', 'string', 'in:light,dark'],
            'notifications_enabled' => ['sometimes', 'boolean'],
        ]);

        $settings = $request->user()->settings()->firstOrCreate([], [
            'theme' => 'light',
            'notifications_enabled' => true,
        ]);
        $settings->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'data' => [
                'settings' => $settings->fresh(),
            ],
        ]);
    }
}
