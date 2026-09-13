<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Payments\MidtransNotificationService;
use Illuminate\Http\Request;

class MidtransNotificationController extends Controller
{
    public function store(Request $request, MidtransNotificationService $service)
    {
        $service->process($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Payment notification processed successfully.',
            'data' => (object) [],
        ]);
    }
}
