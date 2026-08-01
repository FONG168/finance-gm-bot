<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyReport extends Model
{
    use HasFactory;

    protected $table = 'monthly_reports';

    public $timestamps = false;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'month',
        'year',
        'total_income',
        'total_expenses',
        'net_balance',
        'savings_rate',
        'report_data',
        'sent_at'
    ];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'total_income' => 'decimal:2',
        'total_expenses' => 'decimal:2',
        'net_balance' => 'decimal:2',
        'savings_rate' => 'double',
        'report_data' => 'array',
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
