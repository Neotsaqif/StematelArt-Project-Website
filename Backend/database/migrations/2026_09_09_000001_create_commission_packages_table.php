<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('price');
            $table->decimal('platform_fee_rate', 5, 4)->default('0.1000');
            $table->unsignedInteger('delivery_time');
            $table->text('terms')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index('artist_id');
            $table->index('active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_packages');
    }
};
