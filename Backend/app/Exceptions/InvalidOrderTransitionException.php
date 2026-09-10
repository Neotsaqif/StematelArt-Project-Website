<?php

namespace App\Exceptions;

use RuntimeException;

class InvalidOrderTransitionException extends RuntimeException
{
    public function __construct(string $from, string $to)
    {
        parent::__construct("Order cannot transition from {$from} to {$to}.");
    }
}
