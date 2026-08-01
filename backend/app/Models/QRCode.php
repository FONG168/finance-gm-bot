<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QRCode extends Model
{
    protected $table = 'qr_codes';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'provider',
        'image_url',
        'account_name',
        'account_number',
        'instructions',
        'is_active',
        'uploaded_by_id'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];
}
