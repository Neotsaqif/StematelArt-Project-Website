<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('escrow_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('commission_orders')->restrictOnDelete();
            $table->string('type', 20);
            $table->unsignedInteger('amount');
            $table->string('gateway_reference_id', 255)->nullable();
            $table->string('status', 20);
            $table->timestamps();

            $table->unique(['order_id', 'type']);
            $table->index('gateway_reference_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('escrow_transactions');
    }
};
