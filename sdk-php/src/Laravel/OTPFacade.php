<?php

namespace OtpManager\Laravel;

use Illuminate\Support\Facades\Facade;

/**
 * @method static array enroll(string $userId, ?string $email = null, ?string $name = null)
 * @method static array verify(string $userId, string $code)
 * @method static array validate(string $userId, string $code)
 * @method static array getStatus(string $userId)
 * @method static array disable(string $userId)
 * @method static array reset(string $userId)
 * @method static array recovery(string $userId, string $recoveryCode)
 *
 * @see \OtpManager\OTPClient
 */
class OTPFacade extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'otp-manager';
    }
}
