<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $table = 'system_settings';

    public $timestamps = false;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'key',
        'value'
    ];

    protected $casts = [
        'value' => 'array',
        'updated_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();
        static::saving(function ($model) {
            $model->updated_at = $model->freshTimestamp();
        });
    }
}
