<?php

namespace OtpManager\Laravel;

use Illuminate\Support\ServiceProvider;
use OtpManager\OTPClient;

class OTPServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(OTPClient::class, function ($app) {
            $config = $app['config']->get('services.otp', []);
            return new OTPClient(
                $config['url'] ?? env('OTP_SERVICE_URL', 'http://localhost:3500'),
                $config['api_key'] ?? env('OTP_API_KEY', ''),
                $config['api_secret'] ?? env('OTP_API_SECRET', ''),
                (int) ($config['timeout'] ?? env('OTP_TIMEOUT', 10))
            );
        });

        $this->app->alias(OTPClient::class, 'otp-manager');
    }

    public function boot(): void
    {
        // Reserved for future package publishing
    }
}
