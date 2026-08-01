<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\AdminController;
use App\Http\Middleware\AuthenticateTelegramJWT;
use App\Http\Middleware\AuthenticateAdminJWT;

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
});

Route::get('/test-db', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'CategorySeeder', '--force' => true]);
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'RestoreUserDataSeeder', '--force' => true]);
        $count = \App\Models\Category::count();
        $accounts = \App\Models\Account::where('user_id', 'M7YU9ktVW2S0DtE4Bgzt3TLE')->get();
        return response()->json([
            'success' => true, 
            'categories_count' => $count, 
            'restored_accounts' => $accounts,
            'database_url_set' => !empty(env('DATABASE_URL'))
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false, 
            'error' => $e->getMessage(), 
            'file' => $e->getFile(), 
            'line' => $e->getLine()
        ], 500);
    }
});

// Public categories and QR Codes
Route::get('/categories', [AuthController::class, 'getCategories']);
Route::get('/qr-codes', [PaymentController::class, 'getActiveQRCodes']);
Route::get('/subscription-plans', [PaymentController::class, 'getPublicPlans']);

// Public Auth routes
Route::post('/auth/telegram', [AuthController::class, 'telegramAuth']);
Route::post('/auth/bot-token', [AuthController::class, 'botTokenAuth']);

// Admin Auth (Public)
Route::post('/admin/auth/seed', [AdminController::class, 'seed']);
Route::post('/admin/auth/login', [AdminController::class, 'login']);

// User authenticated routes (Telegram WebApp JWT)
Route::middleware([AuthenticateTelegramJWT::class])->group(function () {
    // Auth profile
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/auth/me', [AuthController::class, 'updateProfile']);
    Route::get('/user/export', [AuthController::class, 'exportData']);
    Route::delete('/user/account', [AuthController::class, 'deleteAccount']);
    Route::post('/categories', [AuthController::class, 'storeCategory']);

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::put('/transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);

    // Accounts
    Route::get('/accounts', [AccountController::class, 'index']);
    Route::post('/accounts', [AccountController::class, 'store']);
    Route::put('/accounts/{id}', [AccountController::class, 'update']);
    Route::delete('/accounts/{id}', [AccountController::class, 'destroy']);
    Route::get('/accounts/{id}/transactions', [AccountController::class, 'getAccountTransactions']);
    Route::post('/accounts/transfer', [AccountController::class, 'transferBetweenAccounts']);

    // Analytics
    Route::get('/analytics/weekly', [AnalyticsController::class, 'getWeeklyAnalytics']);
    Route::get('/analytics/monthly', [AnalyticsController::class, 'getMonthlyAnalytics']);
    Route::get('/analytics/accounts', [AnalyticsController::class, 'getAccountSummary']);
    Route::get('/reports', [AnalyticsController::class, 'getReports']);

    // Payments / Subscription
    Route::post('/payments/request', [PaymentController::class, 'submitRequest']);
    Route::get('/payments/my', [PaymentController::class, 'getMyPayments']);
    Route::get('/subscription', [PaymentController::class, 'getSubscriptionStatus']);
});

// Admin authenticated routes
Route::middleware([AuthenticateAdminJWT::class])->group(function () {
    Route::get('/admin/auth/me', [AdminController::class, 'me']);
    Route::post('/admin/auth/create-admin', [AdminController::class, 'createAdmin']);
    
    // Admin Dashboard
    Route::get('/admin/dashboard/stats', [AdminController::class, 'getStats']);
    Route::get('/admin/dashboard/recent-activity', [AdminController::class, 'getRecentActivity']);

    // Admin Users
    Route::get('/admin/users', [AdminController::class, 'getUsers']);
    Route::get('/admin/users/{id}', [AdminController::class, 'getUserDetail']);
    Route::post('/admin/users/{id}/suspend', [AdminController::class, 'suspendUser']);
    Route::post('/admin/users/{id}/unsuspend', [AdminController::class, 'unsuspendUser']);
    Route::post('/admin/users/{id}/ban', [AdminController::class, 'banUser']);
    Route::post('/admin/users/{id}/unban', [AdminController::class, 'unbanUser']);
    Route::post('/admin/users/{id}/extend-trial', [AdminController::class, 'extendTrial']);
    Route::post('/admin/users/{id}/activate-premium', [AdminController::class, 'activatePremium']);
    Route::post('/admin/users/{id}/downgrade', [AdminController::class, 'downgradeUser']);
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);

    // Admin Payments
    Route::get('/admin/payments', [AdminController::class, 'getPayments']);
    Route::get('/admin/payments/{id}', [AdminController::class, 'getPaymentDetail']);
    Route::post('/admin/payments/{id}/approve', [AdminController::class, 'approvePayment']);
    Route::post('/admin/payments/{id}/reject', [AdminController::class, 'rejectPayment']);

    // Admin QR Codes & Uploads
    Route::get('/admin/qr-codes', [AdminController::class, 'getQRCodes']);
    Route::put('/admin/qr-codes/{provider}', [AdminController::class, 'upsertQRCode']);
    Route::delete('/admin/qr-codes/{provider}', [AdminController::class, 'deleteQRCode']);
    Route::post('/admin/upload', [AdminController::class, 'uploadImage']);

    // Admin Announcements
    Route::get('/admin/announcements', [AdminController::class, 'getAnnouncements']);
    Route::post('/admin/announcements', [AdminController::class, 'createAnnouncement']);
    Route::delete('/admin/announcements/{id}', [AdminController::class, 'deleteAnnouncement']);

    // Admin Audit Logs
    Route::get('/admin/audit-logs', [AdminController::class, 'getAuditLogs']);

    // Admin Settings
    Route::get('/admin/settings', [AdminController::class, 'getSettings']);
    Route::put('/admin/settings/{key}', [AdminController::class, 'updateSetting']);
    Route::get('/admin/settings/admins/list', [AdminController::class, 'getAdmins']);
    Route::put('/admin/settings/admins/{id}/permissions', [AdminController::class, 'updateAdminPermissions']);
});
