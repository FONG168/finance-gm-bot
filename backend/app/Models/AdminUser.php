<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminUser extends Model
{
    use HasFactory;

    protected $table = 'admin_users';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'email',
        'password_hash',
        'first_name',
        'last_name',
        'role',
        'permissions',
        'is_active',
        'last_login_at',
        'created_by_id'
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean',
        'last_login_at' => 'datetime'
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by_id');
    }

    public function createdAdmins(): HasMany
    {
        return $this->hasMany(AdminUser::class, 'created_by_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'admin_id');
    }

    public function approvedPayments(): HasMany
    {
        return $this->hasMany(PaymentRequest::class, 'reviewed_by_id');
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class, 'created_by_id');
    }
}
