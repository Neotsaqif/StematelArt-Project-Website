<?php

namespace App\Enums;

enum EscrowTransactionType: string
{
    case Hold = 'hold';
    case Release = 'release';
    case Refund = 'refund';
}
