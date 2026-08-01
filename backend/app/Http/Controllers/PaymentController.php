<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PaymentRequest;
use App\Models\QRCode;
use App\Models\User;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function submitRequest(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'nullable|string',
            'plan' => 'required|in:FREE,PREMIUM,LIFETIME',
            'durationDays' => 'required|integer|min:1',
            'qrProvider' => 'nullable|string',
            'screenshotUrl' => 'nullable|string',
            'note' => 'nullable|string'
        ]);

        $amount = (float) $request->input('amount');
        $currency = $request->input('currency', 'USD');
        $plan = $request->input('plan');
        $durationDays = (int) $request->input('durationDays');
        $qrProvider = $request->input('qrProvider');
        $screenshotUrl = $request->input('screenshotUrl');
        $note = $request->input('note');

        // Handle Base64 receipt screenshot decoding to file
        if ($screenshotUrl && str_starts_with($screenshotUrl, 'data:image/')) {
            try {
                if (preg_match('/^data:image\/(\w+);base64,/', $screenshotUrl, $type)) {
                    $data = substr($screenshotUrl, strpos($screenshotUrl, ',') + 1);
                    $type = strtolower($type[1]);
                    $data = base64_decode($data);

                    if ($data !== false) {
                        $dir = public_path('uploads/receipts');
                        if (!file_exists($dir)) {
                            mkdir($dir, 0755, true);
                        }
                        $filename = 'receipt_' . time() . '_' . Str::random(6) . '.' . ($type === 'jpeg' ? 'jpg' : $type);
                        file_put_contents($dir . '/' . $filename, $data);
                        $screenshotUrl = '/uploads/receipts/' . $filename;
                    }
                }
            } catch (\Exception $e) {
                // Keep original if decoding fails
            }
        }

        $payment = PaymentRequest::create([
            'id' => Str::random(24),
            'user_id' => $user->id,
            'amount' => $amount,
            'currency' => $currency,
            'plan' => $plan,
            'duration_days' => $durationDays,
            'qr_provider' => $qrProvider,
            'screenshot_url' => $screenshotUrl,
            'note' => $note,
            'status' => 'PENDING'
        ]);

        // Invalidate admin stats cache so dashboard updates instantly
        \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $payment->id,
                'status' => $payment->status
            ]
        ], 201);
    }

    public function getActiveQRCodes()
    {
        $qrCodes = QRCode::where('is_active', true)->orderBy('provider', 'asc')->get();
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

    public function getPublicPlans()
    {
        $setting = \App\Models\SystemSetting::where('key', 'subscription_plans')->first();
        $plans = $setting && is_array($setting->value) ? $setting->value : [
            [
                'id' => '1_month',
                'name' => '1 Month',
                'price' => 2.99,
                'currency' => 'USD',
                'days' => 30,
                'popular' => true,
                'description' => '30 days unlimited access',
            ]
        ];
        return response()->json(['success' => true, 'data' => $plans]);
    }

    public function getMyPayments(Request $request)
    {
        $user = $request->user();

        $payments = PaymentRequest::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json(['success' => true, 'data' => $payments]);
    }

    public function getSubscriptionStatus(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'plan' => $user->plan,
                'subscriptionStatus' => $user->subscription_status,
                'trialEndsAt' => $user->trial_ends_at ? $user->trial_ends_at->toIso8601String() : null,
                'premiumStartedAt' => $user->premium_started_at ? $user->premium_started_at->toIso8601String() : null,
                'premiumExpiresAt' => $user->premium_expires_at ? $user->premium_expires_at->toIso8601String() : null,
            ]
        ]);
    }
}
