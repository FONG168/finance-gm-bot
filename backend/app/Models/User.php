<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    use HasFactory;

    protected $table = 'users';
    
    // Disable autoincrementing key since we use CUID/UUID strings
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'telegram_id',
        'first_name',
        'last_name',
        'username',
        'photo_url',
        'language_code',
        'currency',
        'timezone',
        'preferred_language',
        'is_active',
        'is_banned',
        'is_suspended',
        'plan',
        'subscription_status',
        'trial_ends_at',
        'premium_started_at',
        'premium_expires_at'
    ];

    protected $casts = [
        'telegram_id' => 'integer',
        'is_active' => 'boolean',
        'is_banned' => 'boolean',
        'is_suspended' => 'boolean',
        'trial_ends_at' => 'datetime',
        'premium_started_at' => 'datetime',
        'premium_expires_at' => 'datetime',
    ];

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'user_id');
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class, 'user_id');
    }

    public function budgets(): HasMany
    {
        return $this->hasMany(Budget::class, 'user_id');
    }

    public function weeklyReports(): HasMany
    {
        return $this->hasMany(WeeklyReport::class, 'user_id');
    }

    public function monthlyReports(): HasMany
    {
        return $this->hasMany(MonthlyReport::class, 'user_id');
    }

    public function paymentRequests(): HasMany
    {
        return $this->hasMany(PaymentRequest::class, 'user_id');
    }

    public function subscriptionLogs(): HasMany
    {
        return $this->hasMany(SubscriptionLog::class, 'user_id');
    }
}
