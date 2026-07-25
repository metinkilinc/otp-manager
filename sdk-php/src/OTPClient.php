<?php

namespace OtpManager;

use OtpManager\Exceptions\OTPException;

class OTPClient
{
    private string $baseUrl;
    private string $apiKey;
    private string $apiSecret;
    private int $timeout;

    public function __construct(string $baseUrl, string $apiKey, string $apiSecret, int $timeout = 10)
    {
        if (empty($baseUrl)) {
            throw new OTPException('CONFIG_ERROR', 'baseUrl is required');
        }
        if (empty($apiKey)) {
            throw new OTPException('CONFIG_ERROR', 'apiKey is required');
        }
        if (empty($apiSecret)) {
            throw new OTPException('CONFIG_ERROR', 'apiSecret is required');
        }

        $this->baseUrl = rtrim($baseUrl, '/') . '/api/v1/totp';
        $this->apiKey = $apiKey;
        $this->apiSecret = $apiSecret;
        $this->timeout = $timeout;
    }

    private function computeHmac(array $body, string $timestamp): string
    {
        if (!empty($body)) {
            ksort($body);
            $normalizedBody = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        } else {
            $normalizedBody = '{}';
        }
        return hash_hmac('sha256', $normalizedBody . $timestamp, $this->apiSecret);
    }

    private function request(string $method, string $endpoint, array $body = []): array
    {
        $timestamp = (string) time();
        $signature = $this->computeHmac($body, $timestamp);
        $url = $this->baseUrl . $endpoint;

        $headers = [
            'Content-Type: application/json',
            'X-API-Key: ' . $this->apiKey,
            'X-Signature: ' . $signature,
            'X-Timestamp: ' . $timestamp,
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, !empty($body) ? json_encode($body) : '{}');
        } elseif ($method === 'GET') {
            curl_setopt($ch, CURLOPT_HTTPGET, true);
        } else {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            if (!empty($body)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            }
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new OTPException('NETWORK_ERROR', "cURL Error: $curlError", 0);
        }

        $json = json_decode($response, true);
        if (!is_array($json)) {
            throw new OTPException('SERVER_ERROR', "Invalid JSON response (HTTP $httpCode)", $httpCode);
        }

        if ($httpCode >= 400 || isset($json['error'])) {
            $err = $json['error'] ?? [];
            throw new OTPException(
                $err['code'] ?? 'SERVER_ERROR',
                $err['message'] ?? 'An error occurred',
                $httpCode
            );
        }

        return $json['data'] ?? [];
    }

    /**
     * Starts a new TOTP 2FA enrollment.
     */
    public function enroll(string $userId, ?string $email = null, ?string $name = null): array
    {
        $payload = ['userId' => $userId];
        if ($email !== null) {
            $payload['email'] = $email;
        }
        if ($name !== null) {
            $payload['name'] = $name;
        }
        return $this->request('POST', '/enroll', $payload);
    }

    /**
     * Verifies initial 2FA enrollment setup code.
     */
    public function verify(string $userId, string $code): array
    {
        return $this->request('POST', '/verify', ['userId' => $userId, 'code' => $code]);
    }

    /**
     * Validates a 6-digit TOTP code during login.
     */
    public function validate(string $userId, string $code): array
    {
        return $this->request('POST', '/validate', ['userId' => $userId, 'code' => $code]);
    }

    /**
     * Gets enrollment status for a user.
     */
    public function getStatus(string $userId): array
    {
        return $this->request('GET', '/status/' . urlencode($userId));
    }

    /**
     * Disables 2FA for a user.
     */
    public function disable(string $userId): array
    {
        return $this->request('POST', '/disable', ['userId' => $userId]);
    }

    /**
     * Resets 2FA secret and generates a new QR code.
     */
    public function reset(string $userId): array
    {
        return $this->request('POST', '/reset', ['userId' => $userId]);
    }

    /**
     * Bypasses 2FA using a backup recovery code.
     */
    public function recovery(string $userId, string $recoveryCode): array
    {
        return $this->request('POST', '/recovery', [
            'userId' => $userId,
            'recoveryCode' => $recoveryCode,
        ]);
    }
}
