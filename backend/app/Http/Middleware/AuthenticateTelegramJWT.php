<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Models\User;

class AuthenticateTelegramJWT
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['success' => false, 'error' => 'No token provided'], 401);
        }

        $token = substr($authHeader, 7);
        $jwtSecret = env('JWT_SECRET');

        if (!$jwtSecret) {
            return response()->json(['success' => false, 'error' => 'JWT Secret not configured'], 500);
        }

        try {
            $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
            
            // Check if user exists
            $user = User::find($decoded->userId);
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not found'], 401);
            }

            // Set user on request
            $request->setUserResolver(function () use ($user) {
                return $user;
            });
            
            $request->attributes->set('jwt_payload', $decoded);

            return $next($request);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => 'Invalid or expired token'], 401);
        }
    }
}
