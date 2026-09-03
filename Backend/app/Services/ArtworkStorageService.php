<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class ArtworkStorageService
{
    public function store(UploadedFile $file, int $userId): string
    {
        return $this->storeContents($file->get(), strtolower($file->extension()), $userId);
    }

    public function storeContents(string $contents, string $extension, int $userId): string
    {
        $diskName = config('filesystems.artwork_storage_disk', 'supabase');
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = 'artworks/'.$userId.'/'.$filename;
        $storedPath = Storage::disk($diskName)->put($path, $contents);

        if (!$storedPath) {
            throw new \RuntimeException('Artwork storage failed.');
        }

        return $path;
    }

    public function delete(string $path): bool
    {
        $diskName = config('filesystems.artwork_storage_disk', 'supabase');

        return Storage::disk($diskName)->delete($path);
    }

    public function temporaryUrl(string $path): ?string
    {
        $diskName = config('filesystems.artwork_storage_disk', 'supabase');

        try {
            $url = Storage::disk($diskName)->temporaryUrl(
                $path,
                now()->addMinutes(15)
            );

            return $url ?: null;
        } catch (Throwable $exception) {
            Log::warning('Unable to generate artwork temporary URL.', [
                'disk' => $diskName,
                'path' => $path,
            ]);

            return null;
        }
    }
}
