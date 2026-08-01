<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Account;
use Firebase\JWT\JWT;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private function validateTelegramInitData(string $initData, string $botToken): bool
    {
        try {
            $params = [];
            $parts = explode('&', $initData);
            $hash = null;
            
            foreach ($parts as $part) {
                $kv = explode('=', $part, 2);
                if (count($kv) === 2) {
                    $key = urldecode($kv[0]);
                    $val = urldecode($kv[1]);
                    if ($key === 'hash') {
                        $hash = $val;
                    } else {
                        $params[$key] = $val;
                    }
                }
            }
            
            if (!$hash) return false;
            
            ksort($params);
            
            $checkStringArr = [];
            foreach ($params as $key => $val) {
                $checkStringArr[] = "$key=$val";
            }
            $checkString = implode("\n", $checkStringArr);
            
            $secretKey = hash_hmac('sha256', $botToken, 'WebAppData', true);
            $expectedHash = hash_hmac('sha256', $checkString, $secretKey);
            
            if (hash_equals($expectedHash, $hash)) {
                return true;
            }

            // Try raw values check if urldecode failed
            $paramsRaw = [];
            foreach ($parts as $part) {
                $kv = explode('=', $part, 2);
                if (count($kv) === 2 && $kv[0] !== 'hash') {
                    $paramsRaw[urldecode($kv[0])] = $kv[1];
                }
            }
            ksort($paramsRaw);
            $checkStringRawArr = [];
            foreach ($paramsRaw as $key => $val) {
                $checkStringRawArr[] = "$key=$val";
            }
            $checkStringRaw = implode("\n", $checkStringRawArr);
            $expectedHashRaw = hash_hmac('sha256', $checkStringRaw, $secretKey);
            
            return hash_equals($expectedHashRaw, $hash);
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function generateJWT(User $user): string
    {
        $payload = [
            'userId' => $user->id,
            'telegramId' => (int) $user->telegram_id,
            'firstName' => $user->first_name,
            'iat' => time(),
            'exp' => time() + (7 * 24 * 60 * 60) // 7 days
        ];

        return JWT::encode($payload, env('JWT_SECRET'), 'HS256');
    }

    private function seedDefaultAccount(string $userId): void
    {
        $existing = Account::where('user_id', $userId)->where('is_default', true)->first();
        if (!$existing) {
            Account::create([
                'id' => Str::random(24),
                'user_id' => $userId,
                'name' => 'Cash on Hand',
                'type' => 'cash',
                'balance' => 0.00,
                'currency' => 'USD',
                'color' => '#10b981',
                'icon' => '💵',
                'is_default' => true
            ]);
        }
    }

    public function telegramAuth(Request $request)
    {
        $initData = $request->input('initData');

        if (!$initData) {
            return response()->json(['success' => false, 'error' => 'initData is required'], 400);
        }

        $botToken = env('BOT_TOKEN');
        $isValid = env('APP_ENV') === 'local' ? true : $this->validateTelegramInitData($initData, $botToken);

        if (!$isValid) {
            return response()->json(['success' => false, 'error' => 'Invalid Telegram authentication data'], 401);
        }

        // Parse user data from query parameters
        parse_str($initData, $parsed);
        $userRaw = $parsed['user'] ?? null;

        if (!$userRaw) {
            // Check if user is in JSON form inside parsed URL parts (e.g. nested URL parameters)
            // Sometimes parse_str fails to extract a JSON string perfectly due to quotes
            // So we extract it manually
            preg_match('/user=([^&]+)/', $initData, $matches);
            if (isset($matches[1])) {
                $userRaw = urldecode($matches[1]);
            }
        }

        if (!$userRaw) {
            return response()->json(['success' => false, 'error' => 'User data not found in initData'], 400);
        }

        $telegramUser = json_decode($userRaw, true);
        if (!$telegramUser || !isset($telegramUser['id'])) {
            return response()->json(['success' => false, 'error' => 'Malformed user data in initData'], 400);
        }

        $user = User::where('telegram_id', $telegramUser['id'])->first();

        if ($user) {
            $user->update([
                'first_name' => $telegramUser['first_name'],
                'last_name' => $telegramUser['last_name'] ?? null,
                'username' => $telegramUser['username'] ?? null,
                'photo_url' => $telegramUser['photo_url'] ?? null,
                'language_code' => $telegramUser['language_code'] ?? null,
            ]);
        } else {
            $user = User::create([
                'id' => Str::random(24),
                'telegram_id' => $telegramUser['id'],
                'first_name' => $telegramUser['first_name'],
                'last_name' => $telegramUser['last_name'] ?? null,
                'username' => $telegramUser['username'] ?? null,
                'photo_url' => $telegramUser['photo_url'] ?? null,
                'language_code' => $telegramUser['language_code'] ?? null,
                'trial_ends_at' => now()->addDays(14),
            ]);
        }

        $this->seedDefaultAccount($user->id);
        $token = $this->generateJWT($user);

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'telegramId' => (int) $user->telegram_id,
                    'firstName' => $user->first_name,
                    'lastName' => $user->last_name,
                    'username' => $user->username,
                    'photoUrl' => $user->photo_url,
                    'currency' => $user->currency,
                    'timezone' => $user->timezone,
                    'preferredLanguage' => $user->preferred_language,
                    'plan' => $user->plan,
                    'subscriptionStatus' => $user->subscription_status,
                    'trialEndsAt' => $user->trial_ends_at ? $user->trial_ends_at->toIso8601String() : null,
                    'premiumStartedAt' => $user->premium_started_at ? $user->premium_started_at->toIso8601String() : null,
                    'premiumExpiresAt' => $user->premium_expires_at ? $user->premium_expires_at->toIso8601String() : null,
                ]
            ]
        ]);
    }

    public function botTokenAuth(Request $request)
    {
        $uid = $request->input('uid');
        $tok = $request->input('tok');

        if (!$uid || !$tok) {
            return response()->json(['success' => false, 'error' => 'uid and tok required'], 400);
        }

        $botToken = env('BOT_TOKEN');
        $expected = hash_hmac('sha256', "telegramId:{$uid}", $botToken);

        if (!hash_equals($expected, $tok)) {
            return response()->json(['success' => false, 'error' => 'Invalid token'], 401);
        }

        $user = User::where('telegram_id', $uid)->first();

        if (!$user) {
            return response()->json(['success' => false, 'error' => 'User not found — send /start to the bot first'], 404);
        }

        $token = $this->generateJWT($user);

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'telegramId' => (int) $user->telegram_id,
                    'firstName' => $user->first_name,
                    'lastName' => $user->last_name,
                    'username' => $user->username,
                    'photoUrl' => $user->photo_url,
                    'currency' => $user->currency,
                    'timezone' => $user->timezone,
                    'preferredLanguage' => $user->preferred_language,
                    'plan' => $user->plan,
                    'subscriptionStatus' => $user->subscription_status,
                    'trialEndsAt' => $user->trial_ends_at ? $user->trial_ends_at->toIso8601String() : null,
                    'premiumStartedAt' => $user->premium_started_at ? $user->premium_started_at->toIso8601String() : null,
                    'premiumExpiresAt' => $user->premium_expires_at ? $user->premium_expires_at->toIso8601String() : null,
                ]
            ]
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        // Lazy set trial ends
        if ($user->plan === 'FREE' && $user->subscription_status === 'TRIAL' && !$user->trial_ends_at) {
            $user->trial_ends_at = $user->created_at->addDays(14);
            $user->save();
        }

        // Auto expire trial
        if ($user->plan === 'FREE' && $user->subscription_status === 'TRIAL' && $user->trial_ends_at && $user->trial_ends_at->isPast()) {
            $user->subscription_status = 'EXPIRED';
            $user->save();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'telegramId' => (int) $user->telegram_id,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'username' => $user->username,
                'photoUrl' => $user->photo_url,
                'currency' => $user->currency,
                'timezone' => $user->timezone,
                'preferredLanguage' => $user->preferred_language,
                'plan' => $user->plan,
                'subscriptionStatus' => $user->subscription_status,
                'trialEndsAt' => $user->trial_ends_at ? $user->trial_ends_at->toIso8601String() : null,
                'premiumStartedAt' => $user->premium_started_at ? $user->premium_started_at->toIso8601String() : null,
                'premiumExpiresAt' => $user->premium_expires_at ? $user->premium_expires_at->toIso8601String() : null,
                'createdAt' => $user->created_at->toIso8601String(),
                'updatedAt' => $user->updated_at->toIso8601String(),
            ]
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $currency = $request->input('currency');
        $timezone = $request->input('timezone');
        $preferredLanguage = $request->input('preferredLanguage');

        $allowedCurrencies = ['USD', 'KHR'];
        $allowedTimezones = ['UTC', 'Asia/Phnom_Penh', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'America/New_York', 'Europe/London'];
        $allowedLanguages = ['en', 'km', 'zh'];

        $updates = [];
        if ($currency && in_array($currency, $allowedCurrencies)) {
            $updates['currency'] = $currency;
        }
        if ($timezone && in_array($timezone, $allowedTimezones)) {
            $updates['timezone'] = $timezone;
        }
        if ($preferredLanguage && in_array($preferredLanguage, $allowedLanguages)) {
            $updates['preferred_language'] = $preferredLanguage;
        }

        if (empty($updates)) {
            return response()->json(['success' => false, 'error' => 'No valid fields to update'], 400);
        }

        $user->update($updates);

        return response()->json([
            'success' => true,
            'data' => [
                'currency' => $user->currency,
                'timezone' => $user->timezone,
                'preferredLanguage' => $user->preferred_language
            ]
        ]);
    }

    public function exportData(Request $request)
    {
        $user = $request->user();
        
        $transactions = $user->transactions()->orderBy('date', 'desc')->get();
        $accounts = $user->accounts()->get();

        $exportData = [
            'exportedAt' => now()->toIso8601String(),
            'user' => [
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'currency' => $user->currency,
                'timezone' => $user->timezone,
                'createdAt' => $user->created_at->toIso8601String()
            ],
            'accounts' => $accounts->map(function ($a) {
                return [
                    'name' => $a->name,
                    'type' => $a->type,
                    'balance' => (float) $a->balance,
                    'currency' => $a->currency,
                    'createdAt' => $a->created_at->toIso8601String()
                ];
            }),
            'transactions' => $transactions->map(function ($t) {
                return [
                    'date' => $t->date->toIso8601String(),
                    'type' => $t->type,
                    'amount' => (float) $t->amount,
                    'categoryId' => $t->category_id,
                    'note' => $t->note,
                    'createdAt' => $t->created_at->toIso8601String()
                ];
            })
        ];

        return response()->json($exportData, 200, [
            'Content-Disposition' => 'attachment; filename="finance-gm-export.json"'
        ]);
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account permanently deleted'
        ]);
    }

    public function getCategories()
    {
        try {
            $categories = \App\Models\Category::orderBy('name', 'asc')->get();
            return response()->json(['success' => true, 'data' => $categories]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
        }
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:50',
            'label' => 'required|string|max:100',
            'icon' => 'required|string|max:50',
            'color' => 'required|string|max:20',
            'type' => 'required|string|in:income,expense,both',
        ]);

        $name = strtolower(trim($request->name));

        // Generate a simple ID from name
        $id = preg_replace('/[^a-z0-9]/', '', $name);
        if (empty($id)) {
            $id = 'cat';
        }
        
        // Ensure Name is unique
        if (\App\Models\Category::where('name', $name)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Category name already exists'
            ], 422);
        }

        // Ensure ID is unique
        if (\App\Models\Category::find($id)) {
            $id = $id . '_' . time();
        }

        $category = \App\Models\Category::create([
            'id' => $id,
            'name' => $name,
            'label' => trim($request->label),
            'icon' => trim($request->icon),
            'color' => trim($request->color),
            'type' => $request->type,
        ]);

        return response()->json([
            'success' => true,
            'data' => $category
        ], 201);
    }
}
