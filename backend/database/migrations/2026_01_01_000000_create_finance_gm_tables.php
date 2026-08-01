<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Users table
        Schema::create('users', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->unsignedBigInteger('telegram_id')->unique();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('username')->nullable();
            $table->string('photo_url', 500)->nullable();
            $table->string('language_code', 10)->nullable();
            $table->string('currency', 10)->default('USD');
            $table->string('timezone', 50)->default('UTC');
            $table->string('preferred_language', 10)->default('en');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_banned')->default(false);
            $table->boolean('is_suspended')->default(false);
            $table->string('plan', 20)->default('FREE');
            $table->string('subscription_status', 20)->default('TRIAL');
            $table->dateTime('trial_ends_at')->nullable();
            $table->dateTime('premium_started_at')->nullable();
            $table->dateTime('premium_expires_at')->nullable();
            $table->timestamps();
        });

        // 2. Categories table
        Schema::create('categories', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('name', 50)->unique();
            $table->string('label', 100);
            $table->string('icon', 50);
            $table->string('color', 20);
            $table->string('type', 20); // 'income' | 'expense' | 'both'
        });

        // 3. Accounts table
        Schema::create('accounts', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('user_id', 30);
            $table->string('name');
            $table->string('type'); // 'cash' | 'bank' | 'ewallet' | 'savings' | 'credit'
            $table->decimal('balance', 12, 2)->default(0.00);
            $table->string('currency', 10)->default('USD');
            $table->string('color', 20)->default('#7c3aed');
            $table->string('icon', 50)->default('💵');
            $table->boolean('is_archived')->default(false);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_frozen')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('user_id');
        });

        // 4. Transactions table
        Schema::create('transactions', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('user_id', 30);
            $table->string('account_id', 30)->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('type', 20); // 'income' | 'expense' | 'transfer'
            $table->string('category_id', 30);
            $table->string('note', 500)->nullable();
            $table->string('transfer_id', 50)->nullable();
            $table->dateTime('date')->useCurrent();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('account_id')->references('id')->on('accounts')->onDelete('set null');
            $table->foreign('category_id')->references('id')->on('categories');

            $table->index(['user_id', 'date']);
            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'category_id']);
            $table->index(['user_id', 'account_id']);
        });

        // 5. Budgets table
        Schema::create('budgets', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('user_id', 30);
            $table->string('category_id', 30);
            $table->decimal('amount', 12, 2);
            $table->string('period', 20); // 'weekly' | 'monthly'
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('categories');

            $table->unique(['user_id', 'category_id', 'period', 'start_date']);
        });

        // 6. Weekly Reports table
        Schema::create('weekly_reports', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('user_id', 30);
            $table->dateTime('week_start')->nullable();
            $table->dateTime('week_end')->nullable();
            $table->decimal('total_income', 12, 2)->default(0.00);
            $table->decimal('total_expenses', 12, 2)->default(0.00);
            $table->decimal('net_balance', 12, 2)->default(0.00);
            $table->double('savings_rate')->default(0.00);
            $table->string('top_category')->nullable();
            $table->integer('transaction_count')->default(0);
            $table->json('report_data')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->unique(['user_id', 'week_start']);
            $table->index(['user_id', 'week_start']);
        });

        // 7. Monthly Reports table
        Schema::create('monthly_reports', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('user_id', 30);
            $table->integer('month');
            $table->integer('year');
            $table->decimal('total_income', 12, 2)->default(0.00);
            $table->decimal('total_expenses', 12, 2)->default(0.00);
            $table->decimal('net_balance', 12, 2)->default(0.00);
            $table->double('savings_rate')->default(0.00);
            $table->json('report_data')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->unique(['user_id', 'year', 'month']);
            $table->index(['user_id', 'year', 'month']);
        });

        // 8. Admin Users table
        Schema::create('admin_users', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('role')->default('SUPPORT_AGENT'); // SUPER_ADMIN | ADMIN | MODERATOR | SUPPORT_AGENT
            $table->json('permissions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('last_login_at')->nullable();
            $table->string('created_by_id', 30)->nullable();
            $table->timestamps();
        });

        // 9. Audit Logs table
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('admin_id', 30);
            $table->string('action');
            $table->string('target_type');
            $table->string('target_id')->nullable();
            $table->string('target_user_id', 30)->nullable();
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('admin_id')->references('id')->on('admin_users');
            $table->foreign('target_user_id')->references('id')->on('users');

            $table->index('admin_id');
            $table->index('target_user_id');
            $table->index('action');
            $table->index('created_at');
        });

        // 10. Payment Requests table
        Schema::create('payment_requests', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('user_id', 30);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('USD');
            $table->string('plan', 20); // FREE | PREMIUM | LIFETIME
            $table->integer('duration_days');
            $table->string('qr_provider', 20)->nullable(); // ABA | ACLEDA | WING | KHQR
            $table->string('screenshot_url', 500)->nullable();
            $table->string('note', 500)->nullable();
            $table->string('status', 20)->default('PENDING'); // PENDING | APPROVED | REJECTED | CANCELLED
            $table->string('reviewed_by_id', 30)->nullable();
            $table->dateTime('reviewed_at')->nullable();
            $table->string('reject_reason', 500)->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('reviewed_by_id')->references('id')->on('admin_users');

            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
        });

        // 11. Subscription Logs table
        Schema::create('subscription_logs', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('user_id', 30);
            $table->string('action');
            $table->string('plan', 20);
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            $table->string('note', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->index('user_id');
        });

        // 12. QR Codes table
        Schema::create('qr_codes', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('provider', 20)->unique();
            $table->string('image_url', 500);
            $table->string('account_name')->nullable();
            $table->string('account_number', 50)->nullable();
            $table->text('instructions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('uploaded_by_id', 30)->nullable();
            $table->timestamps();
        });

        // 13. Announcements table
        Schema::create('announcements', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('title');
            $table->text('message');
            $table->string('type', 20)->default('GLOBAL');
            $table->string('channel', 20)->default('BOTH');
            $table->json('target_user_ids')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->dateTime('scheduled_at')->nullable();
            $table->string('created_by_id', 30);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('created_by_id')->references('id')->on('admin_users');
        });

        // 14. System Settings table
        Schema::create('system_settings', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('key')->unique();
            $table->json('value');
            $table->timestamp('updated_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('qr_codes');
        Schema::dropIfExists('subscription_logs');
        Schema::dropIfExists('payment_requests');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('admin_users');
        Schema::dropIfExists('monthly_reports');
        Schema::dropIfExists('weekly_reports');
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('users');
    }
};
