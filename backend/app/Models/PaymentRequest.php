<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentRequest extends Model
{
    protected $table = 'payment_requests';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'amount',
        'currency',
        'plan',
        'duration_days',
        'qr_provider',
        'screenshot_url',
        'note',
        'status',
        'reviewed_by_id',
        'reviewed_at',
        'reject_reason'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'duration_days' => 'integer',
        'reviewed_at' => 'datetime'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'reviewed_by_id');
    }
}
