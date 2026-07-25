<?php

namespace OtpManager\Exceptions;

use Exception;

class OTPException extends Exception
{
    private string $errorCode;
    private int $statusCode;

    public function __construct(string $errorCode, string $message, int $statusCode = 400)
    {
        parent::__construct("[$errorCode] $message (HTTP $statusCode)", $statusCode);
        $this->errorCode = $errorCode;
        $this->statusCode = $statusCode;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
