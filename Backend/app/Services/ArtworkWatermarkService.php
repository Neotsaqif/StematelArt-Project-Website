<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class ArtworkWatermarkService
{
    private const WATERMARK_TEXT = 'StematelART';

    /**
     * @return array{contents: string, extension: string}
     */
    public function process(UploadedFile $file): array
    {
        $sourcePath = $file->getRealPath();
        $imageInfo = $sourcePath ? @getimagesize($sourcePath) : false;

        if ($imageInfo === false || !isset($imageInfo['mime'])) {
            throw ValidationException::withMessages([
                'artwork' => ['The artwork could not be processed as a valid image.'],
            ]);
        }

        [$image, $extension] = $this->decode($sourcePath, $imageInfo['mime']);
        $width = imagesx($image);
        $height = imagesy($image);
        $margin = max(12, (int) round(min($width, $height) * 0.02));
        $fontPath = $this->fontPath();

        imagealphablending($image, true);
        imagesavealpha($image, true);

        if ($fontPath !== null) {
            $fontSize = max(14, min(32, (int) round($width / 32)));
            $bounds = imagettfbbox($fontSize, 0, $fontPath, self::WATERMARK_TEXT);
            $textWidth = abs($bounds[2] - $bounds[0]);
            $textHeight = abs($bounds[7] - $bounds[1]);
            $x = max($margin, $width - $textWidth - $margin);
            $y = max($textHeight + $margin, $height - $margin);
            $shadow = imagecolorallocatealpha($image, 0, 0, 0, 75);
            $foreground = imagecolorallocatealpha($image, 255, 255, 255, 85);
            imagettftext($image, $fontSize, 0, $x + 2, $y + 2, $shadow, $fontPath, self::WATERMARK_TEXT);
            imagettftext($image, $fontSize, 0, $x, $y, $foreground, $fontPath, self::WATERMARK_TEXT);
        } else {
            $font = 5;
            $textWidth = imagefontwidth($font) * strlen(self::WATERMARK_TEXT);
            $textHeight = imagefontheight($font);
            $x = max($margin, $width - $textWidth - $margin);
            $y = max(0, $height - $textHeight - $margin);
            $shadow = imagecolorallocatealpha($image, 0, 0, 0, 75);
            $foreground = imagecolorallocatealpha($image, 255, 255, 255, 85);
            imagestring($image, $font, $x + 2, $y + 2, self::WATERMARK_TEXT, $shadow);
            imagestring($image, $font, $x, $y, self::WATERMARK_TEXT, $foreground);
        }

        ob_start();
        $encoded = match ($extension) {
            'jpg' => imagejpeg($image, null, 90),
            'png' => imagepng($image, null, 6),
            'webp' => imagewebp($image, null, 90),
        };
        $contents = ob_get_clean();
        imagedestroy($image);

        if (!$encoded || $contents === false || $contents === '') {
            throw new \RuntimeException('Artwork watermark processing failed.');
        }

        return [
            'contents' => $contents,
            'extension' => $extension,
        ];
    }

    /**
     * @return array{0: \GdImage, 1: string}
     */
    private function decode(string $path, string $mime): array
    {
        $decoder = match ($mime) {
            'image/jpeg' => 'imagecreatefromjpeg',
            'image/png' => 'imagecreatefrompng',
            'image/webp' => 'imagecreatefromwebp',
            default => null,
        };

        if ($decoder === null || !function_exists($decoder)) {
            throw ValidationException::withMessages([
                'artwork' => ['The artwork format is not supported.'],
            ]);
        }

        $image = @$decoder($path);

        if (!$image instanceof \GdImage) {
            throw ValidationException::withMessages([
                'artwork' => ['The artwork could not be processed as a valid image.'],
            ]);
        }

        return [$image, match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        }];
    }

    private function fontPath(): ?string
    {
        $candidates = [
            resource_path('fonts/DejaVuSans.ttf'),
            'C:\\Windows\\Fonts\\arial.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        ];

        foreach ($candidates as $candidate) {
            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return null;
    }
}
