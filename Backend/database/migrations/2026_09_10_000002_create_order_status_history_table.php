<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('commission_orders')->restrictOnDelete();
            $table->string('from_status', 50);
            $table->string('to_status', 50);
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('changed_at');
            $table->timestamps();

            $table->index(['order_id', 'changed_at']);
            $table->index('actor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_status_history');
    }
};
