<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_status_history', function (Blueprint $table) {
            $table->dropForeign(['actor_id']);
            $table->foreignId('actor_id')->nullable()->change();
            $table->foreign('actor_id')->references('id')->on('users')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('order_status_history', function (Blueprint $table) {
            $table->dropForeign(['actor_id']);
            $table->foreignId('actor_id')->nullable(false)->change();
            $table->foreign('actor_id')->references('id')->on('users')->restrictOnDelete();
        });
    }
};
