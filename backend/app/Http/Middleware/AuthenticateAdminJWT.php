<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Models\AdminUser;

class AuthenticateAdminJWT
{
    private const ROLE_RANK = [
        'SUPER_ADMIN' => 4,
        'ADMIN' => 3,
        'MODERATOR' => 2,
        'SUPPORT_AGENT' => 1,
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$guards): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['success' => false, 'error' => 'Admin token required'], 401);
        }

        $token = substr($authHeader, 7);
        $adminJwtSecret = env('ADMIN_JWT_SECRET') ?: env('JWT_SECRET');

        if (!$adminJwtSecret) {
            return response()->json(['success' => false, 'error' => 'Admin JWT Secret not configured'], 500);
        }

        try {
            $decoded = JWT::decode($token, new Key($adminJwtSecret, 'HS256'));
            
            // Check if admin user exists
            $admin = AdminUser::find($decoded->adminId);
            if (!$admin || !$admin->is_active) {
                return response()->json(['success' => false, 'error' => 'Admin not found or inactive'], 401);
            }

            // Set admin context on request attributes
            $request->attributes->set('admin', $admin);
            $request->attributes->set('admin_payload', $decoded);

            // Optional role or permission guard check
            if (!empty($guards)) {
                $type = $guards[0]; // 'role' or 'permission'
                $value = $guards[1] ?? null;

                if ($type === 'role') {
                    $minRank = self::ROLE_RANK[$value] ?? 1;
                    $adminRank = self::ROLE_RANK[$admin->role] ?? 1;
                    if ($adminRank < $minRank) {
                        return response()->json(['success' => false, 'error' => 'Insufficient role'], 403);
                    }
                } elseif ($type === 'permission') {
                    if ($admin->role !== 'SUPER_ADMIN') {
                        $permissions = $admin->permissions ?? [];
                        if (!in_array($value, $permissions)) {
                            return response()->json(['success' => false, 'error' => "Permission required: {$value}"], 403);
                        }
                    }
                }
            }

            return $next($request);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => 'Invalid or expired admin token'], 401);
        }
    }
}
