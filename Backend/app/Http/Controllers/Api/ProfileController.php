<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user(),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:5000'],
        ]);

        $user = $request->user();
        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => [
                'user' => $user->fresh(),
            ],
        ]);
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $user = $request->user();
        $diskName = config('filesystems.profile_avatar_disk', 'public');
        $disk = Storage::disk($diskName);
        $oldAvatar = $user->avatar;
        $newAvatar = $request->file('avatar')->store('avatars', $diskName);

        if (!$newAvatar) {
            abort(500, 'Avatar upload failed.');
        }

        try {
            $user->forceFill(['avatar' => $newAvatar])->saveOrFail();
        } catch (Throwable $exception) {
            $disk->delete($newAvatar);
            throw $exception;
        }

        if ($oldAvatar && $oldAvatar !== $newAvatar) {
            $disk->delete($oldAvatar);
        }

        return response()->json([
            'success' => true,
            'message' => 'Avatar updated successfully.',
            'data' => [
                'user' => $user->fresh(),
            ],
        ]);
    }
}
