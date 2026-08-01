<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    protected $table = 'announcements';

    public $timestamps = false;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title',
        'message',
        'type',
        'channel',
        'target_user_ids',
        'sent_at',
        'scheduled_at',
        'created_by_id'
    ];

    protected $casts = [
        'target_user_ids' => 'array',
        'sent_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'created_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->created_at = $model->freshTimestamp();
        });
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by_id');
    }
}
