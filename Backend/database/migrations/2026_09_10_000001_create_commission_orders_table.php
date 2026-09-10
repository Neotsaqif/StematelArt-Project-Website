<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_orders', function (Blueprint $table) {
            $table->id();

            // Foreign keys with restrict to preserve order history
            $table->foreignId('package_id')->constrained('commission_packages')->restrictOnDelete();
            $table->foreignId('buyer_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('artist_id')->constrained('users')->restrictOnDelete();

            // Amount snapshot (integer IDR, not float)
            $table->unsignedInteger('amount');
            $table->unsignedInteger('platform_fee_amount');
            $table->unsignedInteger('artist_payout_amount');

            // Order details
            $table->text('brief');
            $table->string('reference_image', 500)->nullable();
            $table->timestamp('deadline_at')->nullable();

            // Status
            $table->string('status', 50)->default('pending_payment');

            $table->timestamps();

            // Indexes for frequently queried columns
            $table->index('package_id');
            $table->index('buyer_id');
            $table->index('artist_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_orders');
    }
};
