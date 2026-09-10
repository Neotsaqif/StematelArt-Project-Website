<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\ValidationException;
use App\Exceptions\InvalidOrderTransitionException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use App\Http\Middleware\RoleMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function (Request $request): bool {
            return $request->is('api/*') || $request->expectsJson();
        });

        $exceptions->render(function (\Throwable $exception, Request $request) {
            if (!$request->is('api/*')) {
                return null;
            }

            if ($exception instanceof HttpResponseException) {
                return $exception->getResponse();
            }

            if ($exception instanceof ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'The given data was invalid.',
                    'errors' => $exception->errors(),
                ], 422);
            }

            $status = match (true) {
                $exception instanceof AuthenticationException => 401,
                $exception instanceof AuthorizationException => 403,
                $exception instanceof InvalidOrderTransitionException => 409,
                $exception instanceof HttpExceptionInterface
                    && in_array($exception->getStatusCode(), [401, 403, 404, 409, 429], true)
                    => $exception->getStatusCode(),
                default => 500,
            };

            return response()->json([
                'success' => false,
                'message' => match ($status) {
                    401 => 'Unauthenticated.',
                    403 => 'Forbidden.',
                    404 => 'Resource not found.',
                    409 => $exception->getMessage(),
                    429 => 'Too many requests. Please try again later.',
                    default => 'An unexpected server error occurred.',
                },
                'errors' => (object) [],
            ], $status);
        });
    })->create();
