<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeeklyReport extends Model
{
    use HasFactory;

    protected $table = 'weekly_reports';
    
    // Only created_at timestamp is present (mapped manually)
    public $timestamps = false;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'week_start',
        'week_end',
        'total_income',
        'total_expenses',
        'net_balance',
        'savings_rate',
        'top_category',
        'transaction_count',
        'report_data',
        'sent_at'
    ];

    protected $casts = [
        'total_income' => 'decimal:2',
        'total_expenses' => 'decimal:2',
        'net_balance' => 'decimal:2',
        'savings_rate' => 'double',
        'transaction_count' => 'integer',
        'report_data' => 'array',
        'week_start' => 'datetime',
        'week_end' => 'datetime',
        'sent_at' => 'datetime',
        'created_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->created_at = $model->freshTimestamp();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
