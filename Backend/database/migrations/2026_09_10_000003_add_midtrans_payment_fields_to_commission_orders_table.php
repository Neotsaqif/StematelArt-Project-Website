<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commission_orders', function (Blueprint $table) {
            $table->string('gateway_order_id', 100)->nullable()->unique()->after('status');
            $table->text('snap_token')->nullable()->after('gateway_order_id');
            $table->timestamp('payment_created_at')->nullable()->after('snap_token');
        });
    }

    public function down(): void
    {
        Schema::table('commission_orders', function (Blueprint $table) {
            $table->dropUnique(['gateway_order_id']);
            $table->dropColumn(['gateway_order_id', 'snap_token', 'payment_created_at']);
        });
    }
};
