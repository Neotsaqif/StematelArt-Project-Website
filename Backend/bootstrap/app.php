<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
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

        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                    'errors' => (object) [],
                ], 401);
            }
        });

        $exceptions->render(function (AuthorizationException $exception, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden.',
                    'errors' => (object) [],
                ], 403);
            }
        });

        $exceptions->render(function (ValidationException $exception, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'The given data was invalid.',
                    'errors' => $exception->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (NotFoundHttpException $exception, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not found.',
                    'errors' => (object) [],
                ], 404);
            }
        });

        $exceptions->render(function (\Throwable $exception, Request $request) {
            if ($request->is('api/*')) {
                if ($exception instanceof AuthenticationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthenticated.',
                        'errors' => (object) [],
                    ], 401);
                }

                if ($exception instanceof AuthorizationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden.',
                        'errors' => (object) [],
                    ], 403);
                }

                if ($exception instanceof ValidationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'The given data was invalid.',
                        'errors' => $exception->errors(),
                    ], 422);
                }

                if ($exception instanceof NotFoundHttpException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Resource not found.',
                        'errors' => (object) [],
                    ], 404);
                }

                if ($exception instanceof HttpExceptionInterface
                    && in_array($exception->getStatusCode(), [401, 403, 404], true)) {
                    $status = $exception->getStatusCode();

                    return response()->json([
                        'success' => false,
                        'message' => match ($status) {
                            401 => 'Unauthenticated.',
                            403 => 'Forbidden.',
                            default => 'Resource not found.',
                        },
                        'errors' => (object) [],
                    ], $status);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'An unexpected server error occurred.',
                    'errors' => (object) [],
                ], 500);
            }
        });
    })->create();
