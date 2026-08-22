<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::get('/assets/{file}', function ($file) {
    $path = base_path('../frontend/dist/assets/' . $file);
    if (File::exists($path)) {
        $type = File::mimeType($path);
        if (str_ends_with($file, '.css')) $type = 'text/css';
        if (str_ends_with($file, '.js')) $type = 'application/javascript';
        return response()->file($path, ['Content-Type' => $type]);
    }
    abort(404);
});

Route::get('/{any?}', function () {
    $path = base_path('../frontend/dist/index.html');
    if (File::exists($path)) {
        return File::get($path);
    }
    return view('welcome');
})->where('any', '^(?!api).*$');


