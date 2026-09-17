<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commission_orders', function (Blueprint $table) {
            $table->timestamp('payment_expires_at')->nullable()->after('payment_created_at');
            $table->timestamp('cancelled_at')->nullable()->after('payment_expires_at');
            $table->timestamp('expired_at')->nullable()->after('cancelled_at');
            $table->index(['status', 'payment_expires_at']);
        });

        Schema::table('escrow_transactions', function (Blueprint $table) {
            $table->string('failure_reason', 500)->nullable()->after('status');
            $table->unsignedInteger('retry_count')->default(0)->after('failure_reason');
            $table->timestamp('last_attempted_at')->nullable()->after('retry_count');
        });
    }

    public function down(): void
    {
        Schema::table('escrow_transactions', function (Blueprint $table) {
            $table->dropColumn(['failure_reason', 'retry_count', 'last_attempted_at']);
        });

        Schema::table('commission_orders', function (Blueprint $table) {
            $table->dropIndex(['status', 'payment_expires_at']);
            $table->dropColumn(['payment_expires_at', 'cancelled_at', 'expired_at']);
        });
    }
};
