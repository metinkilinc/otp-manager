package com.otpmanager.client.exception;

/**
 * Strongly typed exception thrown by the OTP Manager Java SDK.
 */
public class OtpManagerException extends RuntimeException {

    private final String code;
    private final int statusCode;

    public OtpManagerException(String code, String message, int statusCode) {
        super("[" + code + "] " + message + " (HTTP " + statusCode + ")");
        this.code = code;
        this.statusCode = statusCode;
    }

    public String getCode() {
        return code;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
