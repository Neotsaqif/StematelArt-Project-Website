<?php

namespace App\Enums;

enum EscrowTransactionStatus: string
{
    case Held = 'held';
    case Released = 'released';
    case Failed = 'failed';
}
