package com.otpmanager.client;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Spring Boot configuration properties for OTP Manager SDK.
 * Map keys starting with "otp-manager.*".
 */
@ConfigurationProperties(prefix = "otp-manager")
public class OtpManagerProperties {

    /**
     * OTP Manager service base URL (e.g. "http://localhost:3500").
     */
    private String serviceUrl = "http://localhost:3500";

    /**
     * Application API Key.
     */
    private String apiKey = "";

    /**
     * Application API Secret for HMAC signing.
     */
    private String apiSecret = "";

    /**
     * HTTP Timeout in seconds.
     */
    private int timeoutSeconds = 10;

    public String getServiceUrl() { return serviceUrl; }
    public void setServiceUrl(String serviceUrl) { this.serviceUrl = serviceUrl; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getApiSecret() { return apiSecret; }
    public void setApiSecret(String apiSecret) { this.apiSecret = apiSecret; }
    public int getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
}
