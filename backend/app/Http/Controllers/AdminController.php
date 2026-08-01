<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AdminUser;
use App\Models\User;
use App\Models\PaymentRequest;
use App\Models\QRCode;
use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use App\Models\SubscriptionLog;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Firebase\JWT\JWT;

class AdminController extends Controller
{
    private function audit(Request $request, string $action, string $targetType, ?string $targetId = null, ?string $targetUserId = null, $oldValue = null, $newValue = null, $metadata = null)
    {
        $admin = $request->attributes->get('admin');
        AuditLog::create([
            'id' => Str::random(24),
            'admin_id' => $admin->id,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'target_user_id' => $targetUserId,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'metadata' => $metadata,
            'ip_address' => $request->ip(),
            'user_agent' => substr($request->userAgent() ?? '', 0, 500)
        ]);
    }

    private function generateAdminJWT(AdminUser $admin): string
    {
        $payload = [
            'adminId' => $admin->id,
            'email' => $admin->email,
            'role' => $admin->role,
            'permissions' => $admin->permissions ?? [],
            'iat' => time(),
            'exp' => time() + (12 * 60 * 60) // 12 hours
        ];

        $secret = env('ADMIN_JWT_SECRET') ?: env('JWT_SECRET');
        return JWT::encode($payload, $secret, 'HS256');
    }

    // POST /api/admin/auth/seed
    public function seed(Request $request)
    {
        $request->validate([
            'seedKey' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'firstName' => 'required|string'
        ]);

        $seedKey = $request->input('seedKey');
        if ($seedKey !== env('ADMIN_SEED_KEY')) {
            return response()->json(['success' => false, 'error' => 'Invalid seed key'], 403);
        }

        $existing = AdminUser::where('role', 'SUPER_ADMIN')->first();
        if ($existing) {
            return response()->json(['success' => false, 'error' => 'SUPER_ADMIN already exists'], 409);
        }

        $admin = AdminUser::create([
            'id' => Str::random(24),
            'email' => strtolower($request->input('email')),
            'password_hash' => password_hash($request->input('password'), PASSWORD_BCRYPT),
            'first_name' => $request->input('firstName'),
            'lastName' => $request->input('lastName'),
            'role' => 'SUPER_ADMIN',
            'permissions' => []
        ]);

        return response()->json(['success' => true, 'data' => ['id' => $admin->id, 'email' => $admin->email]], 201);
    }

    // POST /api/admin/auth/login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $email = strtolower($request->input('email'));
        $password = $request->input('password');

        $admin = AdminUser::where('email', $email)->first();
        if (!$admin || !$admin->is_active) {
            return response()->json(['success' => false, 'error' => 'Invalid credentials'], 401);
        }

        if (!password_verify($password, $admin->password_hash)) {
            return response()->json(['success' => false, 'error' => 'Invalid credentials'], 401);
        }

        $admin->update(['last_login_at' => now()]);
        $token = $this->generateAdminJWT($admin);

        // Audit log
        AuditLog::create([
            'id' => Str::random(24),
            'admin_id' => $admin->id,
            'action' => 'admin.login',
            'target_type' => 'admin',
            'target_id' => $admin->id,
            'ip_address' => $request->ip(),
            'user_agent' => substr($request->userAgent() ?? '', 0, 500)
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'admin' => [
                    'id' => $admin->id,
                    'email' => $admin->email,
                    'firstName' => $admin->first_name,
                    'lastName' => $admin->last_name,
                    'role' => $admin->role,
                    'permissions' => $admin->permissions ?? [],
                ]
            ]
        ]);
    }

    // GET /api/admin/auth/me
    public function me(Request $request)
    {
        $admin = $request->attributes->get('admin');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $admin->id,
                'email' => $admin->email,
                'firstName' => $admin->first_name,
                'lastName' => $admin->last_name,
                'role' => $admin->role,
                'permissions' => $admin->permissions ?? [],
                'lastLoginAt' => $admin->last_login_at ? $admin->last_login_at->toIso8601String() : null,
            ]
        ]);
    }

    // POST /api/admin/auth/create-admin
    public function createAdmin(Request $request)
    {
        $caller = $request->attributes->get('admin');
        if ($caller->role !== 'SUPER_ADMIN') {
            return response()->json(['success' => false, 'error' => 'Only SUPER_ADMIN can create admins'], 403);
        }

        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'firstName' => 'required|string',
            'role' => 'nullable|string',
            'permissions' => 'nullable|array'
        ]);

        $email = strtolower($request->input('email'));
        $existing = AdminUser::where('email', $email)->first();
        if ($existing) {
            return response()->json(['success' => false, 'error' => 'Email already registered'], 409);
        }

        $admin = AdminUser::create([
            'id' => Str::random(24),
            'email' => $email,
            'password_hash' => password_hash($request->input('password'), PASSWORD_BCRYPT),
            'first_name' => $request->input('firstName'),
            'lastName' => $request->input('lastName'),
            'role' => $request->input('role', 'SUPPORT_AGENT'),
            'permissions' => $request->input('permissions', []),
            'created_by_id' => $caller->id
        ]);

        $this->audit($request, 'admin.create', 'admin', $admin->id, null, null, ['email' => $admin->email, 'role' => $admin->role]);

        return response()->json([
            'success' => true,
            'data' => ['id' => $admin->id, 'email' => $admin->email, 'role' => $admin->role]
        ], 201);
    }

    // GET /api/admin/dashboard/stats
    public function getStats(Request $request)
    {
        $data = \Illuminate\Support\Facades\Cache::remember('admin_dashboard_stats', 10, function () {
            $totalUsers = User::count();
            $trialUsers = User::where('subscription_status', 'TRIAL')->count();
            $premiumUsers = User::whereIn('plan', ['PREMIUM', 'LIFETIME'])->count();
            $expiredUsers = User::where('subscription_status', 'EXPIRED')->count();
            $suspendedUsers = User::where('is_suspended', true)->count();
            $activeUsers = User::where('is_suspended', false)->count();
            $newThisMonth = User::where('created_at', '>=', now()->startOfMonth())->count();

            $pendingPayments = PaymentRequest::where('status', 'PENDING')->count();
            $revenueThisMonth = (float) PaymentRequest::where('status', 'APPROVED')->where('created_at', '>=', now()->startOfMonth())->sum('amount');
            $totalRevenue = (float) PaymentRequest::where('status', 'APPROVED')->sum('amount');

            // User Growth (last 6 months)
            $userGrowth = [];
            for ($i = 5; $i >= 0; $i--) {
                $monthStart = now()->subMonths($i)->startOfMonth();
                $monthEnd = now()->subMonths($i)->endOfMonth();
                $label = $monthStart->format('M Y');
                $count = User::whereBetween('created_at', [$monthStart, $monthEnd])->count();
                $userGrowth[] = ['month' => $label, 'count' => $count];
            }

            // Monthly Revenue (last 6 months)
            $monthlyRevenue = [];
            for ($i = 5; $i >= 0; $i--) {
                $monthStart = now()->subMonths($i)->startOfMonth();
                $monthEnd = now()->subMonths($i)->endOfMonth();
                $label = $monthStart->format('M Y');
                $sum = (float) PaymentRequest::where('status', 'APPROVED')->whereBetween('created_at', [$monthStart, $monthEnd])->sum('amount');
                $monthlyRevenue[] = ['month' => $label, 'revenue' => $sum];
            }

            return [
                'users' => [
                    'total' => $totalUsers,
                    'trial' => $trialUsers,
                    'premium' => $premiumUsers,
                    'expired' => $expiredUsers,
                    'suspended' => $suspendedUsers,
                    'active' => $activeUsers,
                    'newThisMonth' => $newThisMonth,
                ],
                'payments' => [
                    'pending' => $pendingPayments,
                ],
                'revenue' => [
                    'thisMonth' => $revenueThisMonth,
                    'total' => $totalRevenue,
                ],
                'userGrowth' => $userGrowth,
                'monthlyRevenue' => $monthlyRevenue,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // GET /api/admin/dashboard/recent-activity
    public function getRecentActivity(Request $request)
    {
        $activities = AuditLog::with('admin')
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $activities->map(function ($a) {
                return [
                    'id' => $a->id,
                    'action' => $a->action,
                    'targetType' => $a->target_type,
                    'targetId' => $a->target_id,
                    'adminEmail' => $a->admin ? $a->admin->email : 'System',
                    'createdAt' => $a->created_at->toIso8601String(),
                ];
            })
        ]);
    }

    // GET /api/admin/users
    public function getUsers(Request $request)
    {
        $search = $request->query('search');
        $plan = $request->query('plan');
        $status = $request->query('status');
        $page = (int)$request->query('page', 1);
        $limit = (int)$request->query('limit', 20);
        $skip = ($page - 1) * $limit;

        $query = User::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('telegram_id', 'like', "%{$search}%");
            });
        }

        if ($plan) {
            $query->where('plan', $plan);
        }

        if ($status) {
            $query->where('subscription_status', $status);
        }

        $total = $query->count();
        $users = $query->orderBy('created_at', 'desc')
            ->skip($skip)
            ->take($limit)
            ->get();

        $formattedUsers = $users->map(function ($u) {
            return [
                'id' => $u->id,
                'telegramId' => $u->telegram_id,
                'firstName' => $u->first_name,
                'lastName' => $u->last_name,
                'username' => $u->username,
                'photoUrl' => $u->photo_url,
                'currency' => $u->currency,
                'timezone' => $u->timezone,
                'plan' => $u->plan,
                'subscriptionStatus' => $u->subscription_status,
                'trialEndsAt' => $u->trial_ends_at ? $u->trial_ends_at->toIso8601String() : null,
                'premiumExpiresAt' => $u->premium_expires_at ? $u->premium_expires_at->toIso8601String() : null,
                'isSuspended' => (bool)$u->is_suspended,
                'isBanned' => (bool)$u->is_banned,
                'createdAt' => $u->created_at ? $u->created_at->toIso8601String() : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $formattedUsers,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'totalPages' => (int)ceil($total / max(1, $limit)),
                ]
            ]
        ]);
    }

    // GET /api/admin/users/:id
    public function getUserDetail(Request $request, string $id)
    {
        $user = User::with(['transactions', 'accounts', 'paymentRequests'])->find($id);
        if (!$user) {
            return response()->json(['success' => false, 'error' => 'User not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $user]);
    }

    // POST /api/admin/users/:id/suspend
    public function suspendUser(Request $request, string $id)
    {
        $user = User::find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        $user->update(['is_suspended' => true]);
        $this->audit($request, 'user.suspend', 'user', $user->id, $user->id);

        return response()->json(['success' => true, 'data' => $user]);
    }

    // POST /api/admin/users/:id/unsuspend
    public function unsuspendUser(Request $request, string $id)
    {
        $user = User::find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        $user->update(['is_suspended' => false]);
        $this->audit($request, 'user.unsuspend', 'user', $user->id, $user->id);

        return response()->json(['success' => true, 'data' => $user]);
    }

    // POST /api/admin/users/:id/ban
    public function banUser(Request $request, string $id)
    {
        $user = User::find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        $user->update(['is_banned' => true]);
        $this->audit($request, 'user.ban', 'user', $user->id, $user->id);

        return response()->json(['success' => true, 'data' => $user]);
    }

    // POST /api/admin/users/:id/unban
    public function unbanUser(Request $request, string $id)
    {
        $user = User::find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        $user->update(['is_banned' => false]);
        $this->audit($request, 'user.unban', 'user', $user->id, $user->id);

        return response()->json(['success' => true, 'data' => $user]);
    }

    // POST /api/admin/users/:id/extend-trial
    public function extendTrial(Request $request, string $id)
    {
        $request->validate(['days' => 'required|integer|min:1']);
        $days = (int) $request->input('days');

        $user = User::find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        $oldVal = ['trialEndsAt' => $user->trial_ends_at ? $user->trial_ends_at->toIso8601String() : null];
        
        $currentEnd = $user->trial_ends_at && $user->trial_ends_at->isFuture() ? $user->trial_ends_at : now();
        $newEnd = $currentEnd->addDays($days);

        $user->update([
            'trial_ends_at' => $newEnd,
            'subscription_status' => 'TRIAL'
        ]);

        SubscriptionLog::create([
            'id' => Str::random(24),
            'user_id' => $user->id,
            'action' => 'trial_extend',
            'plan' => $user->plan,
            'start_date' => now(),
            'end_date' => $newEnd,
            'note' => "Extended trial by {$days} days"
        ]);

        $this->audit($request, 'user.extend_trial', 'user', $user->id, $user->id, $oldVal, ['trialEndsAt' => $newEnd->toIso8601String()]);

        return response()->json(['success' => true, 'data' => $user]);
    }

    // POST /api/admin/users/:id/activate-premium
    public function activatePremium(Request $request, string $id)
    {
        $request->validate([
            'days' => 'required|integer|min:1',
            'plan' => 'required|in:PREMIUM,LIFETIME'
        ]);

        $days = (int) $request->input('days');
        $plan = $request->input('plan');

        $user = User::find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        $oldVal = [
            'plan' => $user->plan,
            'subscriptionStatus' => $user->subscription_status,
            'premiumExpiresAt' => $user->premium_expires_at ? $user->premium_expires_at->toIso8601String() : null
        ];

        $currentExpires = $user->premium_expires_at && $user->premium_expires_at->isFuture() ? $user->premium_expires_at : now();
        $newExpires = $plan === 'LIFETIME' ? null : $currentExpires->addDays($days);

        $user->update([
            'plan' => $plan,
            'subscription_status' => 'ACTIVE',
            'premium_started_at' => $user->premium_started_at ?: now(),
            'premium_expires_at' => $newExpires
        ]);

        SubscriptionLog::create([
            'id' => Str::random(24),
            'user_id' => $user->id,
            'action' => 'premium_activate',
            'plan' => $plan,
            'start_date' => now(),
            'end_date' => $newExpires,
            'note' => "Activated {$plan} for {$days} days"
        ]);

        $newVal = [
            'plan' => $plan,
            'subscriptionStatus' => 'ACTIVE',
            'premiumExpiresAt' => $newExpires ? $newExpires->toIso8601String() : null
        ];

        $this->audit($request, 'user.activate_premium', 'user', $user->id, $user->id, $oldVal, $newVal);

        return response()->json(['success' => true, 'data' => $user]);
    }

    // POST /api/admin/users/:id/downgrade
    public function downgradeUser(Request $request, string $id)
    {
        $user = User::find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        $oldVal = ['plan' => $user->plan, 'subscriptionStatus' => $user->subscription_status];

        $user->update([
            'plan' => 'FREE',
            'subscription_status' => 'EXPIRED',
            'premium_expires_at' => now()
        ]);

        SubscriptionLog::create([
            'id' => Str::random(24),
            'user_id' => $user->id,
            'action' => 'downgrade',
            'plan' => 'FREE',
            'start_date' => now(),
            'end_date' => now(),
            'note' => "Downgraded to free"
        ]);

        $this->audit($request, 'user.downgrade', 'user', $user->id, $user->id, $oldVal, ['plan' => 'FREE', 'subscriptionStatus' => 'EXPIRED']);

        return response()->json(['success' => true, 'data' => $user]);
    }

    // DELETE /api/admin/users/:id
    public function deleteUser(Request $request, string $id)
    {
        $user = User::find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'User not found'], 404);

        $this->audit($request, 'user.delete', 'user', $user->id, null, ['telegramId' => $user->telegram_id, 'firstName' => $user->first_name]);
        $user->delete();

        return response()->json(['success' => true, 'message' => 'User deleted successfully']);
    }

    // GET /api/admin/payments
    public function getPayments(Request $request)
    {
        $status = $request->query('status');
        $query = PaymentRequest::with('user');

        if ($status) {
            $query->where('status', $status);
        }

        $payments = $query->orderBy('created_at', 'desc')->get();
        $formatted = $payments->map(function ($p) {
            return [
                'id' => $p->id,
                'userId' => $p->user_id,
                'amount' => $p->amount,
                'currency' => $p->currency,
                'plan' => $p->plan,
                'durationDays' => $p->duration_days,
                'qrProvider' => $p->qr_provider,
                'screenshotUrl' => $p->screenshot_url,
                'note' => $p->note,
                'status' => $p->status,
                'reviewedById' => $p->reviewed_by_id,
                'reviewedAt' => $p->reviewed_at ? $p->reviewed_at->toIso8601String() : null,
                'rejectReason' => $p->reject_reason,
                'createdAt' => $p->created_at ? $p->created_at->toIso8601String() : null,
                'user' => $p->user ? [
                    'id' => $p->user->id,
                    'telegramId' => $p->user->telegram_id,
                    'firstName' => $p->user->first_name,
                    'lastName' => $p->user->last_name,
                    'username' => $p->user->username,
                ] : null,
            ];
        });
        return response()->json(['success' => true, 'data' => $formatted]);
    }

    // GET /api/admin/payments/:id
    public function getPaymentDetail(Request $request, string $id)
    {
        $payment = PaymentRequest::with('user')->find($id);
        if (!$payment) return response()->json(['success' => false, 'error' => 'Payment request not found'], 404);

        return response()->json(['success' => true, 'data' => $payment]);
    }

    // POST /api/admin/payments/:id/approve
    public function approvePayment(Request $request, string $id)
    {
        $payment = PaymentRequest::find($id);
        if (!$payment) return response()->json(['success' => false, 'error' => 'Payment request not found'], 404);

        if ($payment->status !== 'PENDING') {
            return response()->json(['success' => false, 'error' => 'Payment has already been processed'], 400);
        }

        $caller = $request->attributes->get('admin');

        DB::transaction(function () use ($payment, $caller) {
            $payment->update([
                'status' => 'APPROVED',
                'reviewed_by_id' => $caller->id,
                'reviewed_at' => now()
            ]);

            // Update user subscription
            $user = User::find($payment->user_id);
            if ($user) {
                $currentExpires = $user->premium_expires_at && $user->premium_expires_at->isFuture() ? $user->premium_expires_at : now();
                $newExpires = $payment->plan === 'LIFETIME' ? null : $currentExpires->addDays($payment->duration_days);

                $user->update([
                    'plan' => $payment->plan,
                    'subscription_status' => 'ACTIVE',
                    'premium_started_at' => $user->premium_started_at ?: now(),
                    'premium_expires_at' => $newExpires
                ]);

                SubscriptionLog::create([
                    'id' => Str::random(24),
                    'user_id' => $user->id,
                    'action' => 'premium_activate',
                    'plan' => $payment->plan,
                    'start_date' => now(),
                    'end_date' => $newExpires,
                    'note' => "Payment Approved: ID {$payment->id}"
                ]);

                // Send Telegram Notification to user
                if ($user->telegram_id) {
                    $botToken = env('TELEGRAM_BOT_TOKEN');
                    if ($botToken) {
                        $msg = "🎉 <b>Payment Approved!</b>\n\nYour <b>{$payment->plan}</b> subscription (+{$payment->duration_days} days) is now <b>ACTIVE</b>! Thank you for upgrading.";
                        @file_get_contents("https://api.telegram.org/bot{$botToken}/sendMessage?" . http_build_query([
                            'chat_id' => $user->telegram_id,
                            'text' => $msg,
                            'parse_mode' => 'HTML',
                        ]));
                    }
                }
            }
        });

        \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');
        $this->audit($request, 'payment.approve', 'payment', $payment->id, $payment->user_id);

        return response()->json(['success' => true, 'data' => $payment]);
    }

    // POST /api/admin/payments/:id/reject
    public function rejectPayment(Request $request, string $id)
    {
        $request->validate(['reason' => 'nullable|string']);
        $reason = $request->input('reason') ?: 'Rejected by Admin';

        $payment = PaymentRequest::find($id);
        if (!$payment) return response()->json(['success' => false, 'error' => 'Payment request not found'], 404);

        if ($payment->status !== 'PENDING') {
            return response()->json(['success' => false, 'error' => 'Payment has already been processed'], 400);
        }

        $caller = $request->attributes->get('admin');

        $payment->update([
            'status' => 'REJECTED',
            'reviewed_by_id' => $caller->id,
            'reviewed_at' => now(),
            'reject_reason' => $reason
        ]);

        // Send Telegram Notification to user
        $user = User::find($payment->user_id);
        if ($user && $user->telegram_id) {
            $botToken = env('TELEGRAM_BOT_TOKEN');
            if ($botToken) {
                $msg = "❌ <b>Payment Request Rejected</b>\n\nReason: <i>{$reason}</i>\nPlease contact support if you need assistance.";
                @file_get_contents("https://api.telegram.org/bot{$botToken}/sendMessage?" . http_build_query([
                    'chat_id' => $user->telegram_id,
                    'text' => $msg,
                    'parse_mode' => 'HTML',
                ]));
            }
        }

        \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');

        $this->audit($request, 'payment.reject', 'payment', $payment->id, $payment->user_id, null, ['rejectReason' => $reason]);

        return response()->json(['success' => true, 'data' => $payment]);
    }

    // GET /api/admin/qr-codes
    public function getQRCodes(Request $request)
    {
        $qrCodes = QRCode::orderBy('provider', 'asc')->get();
        $formatted = $qrCodes->map(function ($q) {
            return [
                'id' => $q->id,
                'provider' => $q->provider,
                'imageUrl' => $q->image_url,
                'accountName' => $q->account_name,
                'accountNumber' => $q->account_number,
                'instructions' => $q->instructions,
                'isActive' => (bool)$q->is_active,
                'createdAt' => $q->created_at ? $q->created_at->toIso8601String() : null,
            ];
        });
        return response()->json(['success' => true, 'data' => $formatted]);
    }

    // PUT /api/admin/qr-codes/:provider
    public function upsertQRCode(Request $request, string $provider)
    {
        $request->validate([
            'imageUrl' => 'nullable|string',
            'accountName' => 'nullable|string',
            'accountNumber' => 'nullable|string',
            'instructions' => 'nullable|string',
            'isActive' => 'nullable|boolean'
        ]);

        $caller = $request->attributes->get('admin');
        $qr = QRCode::where('provider', strtoupper($provider))->first();

        $imageUrl = $request->input('imageUrl');

        // Automatically convert base64 image data strings to physical files on disk
        if ($imageUrl && str_starts_with($imageUrl, 'data:image')) {
            if (preg_match('/data:image\/(?<type>\w+);base64,(?<data>.+)/', $imageUrl, $matches)) {
                $imageData = base64_decode($matches['data']);
                $extension = strtolower($matches['type']) === 'jpeg' ? 'jpg' : ($matches['type'] ?? 'png');
                $filename = strtolower($provider) . '_' . time() . '_' . Str::random(6) . '.' . $extension;
                $dir = public_path('uploads/qr');
                if (!file_exists($dir)) {
                    mkdir($dir, 0755, true);
                }
                file_put_contents($dir . '/' . $filename, $imageData);
                $imageUrl = '/uploads/qr/' . $filename;
            }
        } elseif (!$imageUrl && $qr) {
            $imageUrl = $qr->image_url;
        }

        $data = [
            'image_url' => $imageUrl,
            'account_name' => $request->input('accountName'),
            'account_number' => $request->input('accountNumber'),
            'instructions' => $request->input('instructions'),
            'is_active' => $request->input('isActive', true),
            'uploaded_by_id' => $caller ? $caller->id : null
        ];

        if ($qr) {
            $qr->update($data);
        } else {
            $qr = QRCode::create(array_merge([
                'id' => Str::random(24),
                'provider' => strtoupper($provider)
            ], $data));
        }

        $this->audit($request, 'qrcode.upsert', 'qrcode', $qr->id, null, null, ['provider' => $provider]);

        $formatted = [
            'id' => $qr->id,
            'provider' => $qr->provider,
            'imageUrl' => $qr->image_url,
            'accountName' => $qr->account_name,
            'accountNumber' => $qr->account_number,
            'instructions' => $qr->instructions,
            'isActive' => (bool)$qr->is_active,
            'createdAt' => $qr->created_at ? $qr->created_at->toIso8601String() : null,
        ];

        return response()->json(['success' => true, 'data' => $formatted]);
    }

    // POST /api/admin/upload
    public function uploadImage(Request $request)
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $dir = public_path('uploads/qr');
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }
            $file->move($dir, $filename);
            $url = '/uploads/qr/' . $filename;
            return response()->json(['success' => true, 'url' => $url]);
        }

        return response()->json(['success' => false, 'error' => 'No file uploaded'], 400);
    }

    // DELETE /api/admin/qr-codes/:provider
    public function deleteQRCode(Request $request, string $provider)
    {
        $qr = QRCode::where('provider', strtoupper($provider))->first();
        if (!$qr) return response()->json(['success' => false, 'error' => 'QR Code provider not found'], 404);

        $this->audit($request, 'qrcode.delete', 'qrcode', $qr->id, null, ['provider' => $provider]);
        $qr->delete();

        return response()->json(['success' => true, 'message' => 'QR code deleted successfully']);
    }

    // GET /api/admin/announcements
    public function getAnnouncements(Request $request)
    {
        $announcements = Announcement::orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $announcements]);
    }

    // POST /api/admin/announcements
    public function createAnnouncement(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'message' => 'required|string',
            'type' => 'nullable|string',
            'channel' => 'nullable|string',
            'targetUserIds' => 'nullable|array'
        ]);

        $caller = $request->attributes->get('admin');

        $announcement = Announcement::create([
            'id' => Str::random(24),
            'title' => $request->input('title'),
            'message' => $request->input('message'),
            'type' => $request->input('type', 'GLOBAL'),
            'channel' => $request->input('channel', 'BOTH'),
            'target_user_ids' => $request->input('targetUserIds', []),
            'created_by_id' => $caller->id
        ]);

        $this->audit($request, 'announcement.create', 'announcement', $announcement->id);

        return response()->json(['success' => true, 'data' => $announcement], 201);
    }

    // DELETE /api/admin/announcements/:id
    public function deleteAnnouncement(Request $request, string $id)
    {
        $announcement = Announcement::find($id);
        if (!$announcement) return response()->json(['success' => false, 'error' => 'Announcement not found'], 404);

        $this->audit($request, 'announcement.delete', 'announcement', $announcement->id);
        $announcement->delete();

        return response()->json(['success' => true, 'message' => 'Announcement deleted successfully']);
    }

    // GET /api/admin/audit-logs
    public function getAuditLogs(Request $request)
    {
        $search = $request->query('search');
        $page = (int)$request->query('page', 1);
        $limit = (int)$request->query('limit', 20);
        $skip = ($page - 1) * $limit;

        $query = AuditLog::with('admin');

        if ($search) {
            $query->where('action', 'like', "%{$search}%")
                  ->orWhere('target_type', 'like', "%{$search}%")
                  ->orWhereHas('admin', function ($q) use ($search) {
                      $q->where('email', 'like', "%{$search}%");
                  });
        }

        $total = $query->count();
        $logs = $query->orderBy('created_at', 'desc')
            ->skip($skip)
            ->take($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $logs->map(function ($l) {
                    return [
                        'id' => $l->id,
                        'adminId' => $l->admin_id,
                        'adminEmail' => $l->admin ? $l->admin->email : 'System',
                        'action' => $l->action,
                        'targetType' => $l->target_type,
                        'targetId' => $l->target_id,
                        'targetUserId' => $l->target_user_id,
                        'oldValue' => $l->old_value,
                        'newValue' => $l->new_value,
                        'metadata' => $l->metadata,
                        'ipAddress' => $l->ip_address,
                        'userAgent' => $l->user_agent,
                        'createdAt' => $l->created_at->toIso8601String(),
                    ];
                }),
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'hasMore' => $skip + $limit < $total,
            ]
        ]);
    }

    // GET /api/admin/settings
    public function getSettings(Request $request)
    {
        $settings = SystemSetting::all();
        return response()->json(['success' => true, 'data' => $settings]);
    }

    // PUT /api/admin/settings/:key
    public function updateSetting(Request $request, string $key)
    {
        $request->validate(['value' => 'required']);
        $value = $request->input('value');

        $setting = SystemSetting::where('key', $key)->first();
        $oldVal = $setting ? ['value' => $setting->value] : null;

        if ($setting) {
            $setting->update(['value' => $value]);
        } else {
            $setting = SystemSetting::create([
                'id' => Str::random(24),
                'key' => $key,
                'value' => $value
            ]);
        }

        $this->audit($request, 'setting.update', 'setting', $setting->id, null, $oldVal, ['value' => $value]);

        return response()->json(['success' => true, 'data' => $setting]);
    }

    // GET /api/admin/settings/admins/list
    public function getAdmins(Request $request)
    {
        $admins = AdminUser::with('createdBy')->orderBy('email', 'asc')->get();
        return response()->json(['success' => true, 'data' => $admins]);
    }

    // PUT /api/admin/settings/admins/:id/permissions
    public function updateAdminPermissions(Request $request, string $id)
    {
        $request->validate(['permissions' => 'required|array']);
        $permissions = $request->input('permissions');

        $admin = AdminUser::find($id);
        if (!$admin) return response()->json(['success' => false, 'error' => 'Admin not found'], 404);

        $oldVal = ['permissions' => $admin->permissions];
        $admin->update(['permissions' => $permissions]);

        $this->audit($request, 'admin.permissions_update', 'admin', $admin->id, null, $oldVal, ['permissions' => $permissions]);

        return response()->json(['success' => true, 'data' => $admin]);
    }
}
