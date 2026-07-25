package com.otpmanager.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.otpmanager.client.exception.OtpManagerException;
import com.otpmanager.client.model.OtpModels.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.TreeMap;

/**
 * Official Java &amp; Spring Boot SDK Client for OTP Manager service.
 */
public class OtpManagerClient {

    private final String serviceUrl;
    private final String apiKey;
    private final String apiSecret;
    private final int timeoutSeconds;
    private final ObjectMapper objectMapper;

    public OtpManagerClient(String serviceUrl, String apiKey, String apiSecret) {
        this(serviceUrl, apiKey, apiSecret, 10);
    }

    public OtpManagerClient(String serviceUrl, String apiKey, String apiSecret, int timeoutSeconds) {
        if (serviceUrl == null || serviceUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("serviceUrl is required");
        }
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalArgumentException("apiKey is required");
        }
        if (apiSecret == null || apiSecret.trim().isEmpty()) {
            throw new IllegalArgumentException("apiSecret is required");
        }

        this.serviceUrl = serviceUrl.replaceAll("/+$", "") + "/api/v1/totp";
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 10;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
    }

    public OtpManagerClient(OtpManagerProperties properties) {
        this(properties.getServiceUrl(), properties.getApiKey(), properties.getApiSecret(), properties.getTimeoutSeconds());
    }

    /**
     * Normalizes request body keys and computes HMAC-SHA256 signature matching Node.js server specification.
     */
    private String computeHmac(Object body, String timestamp) {
        try {
            String normalizedBody;
            if (body != null) {
                JsonNode node = objectMapper.valueToTree(body);
                Map<String, Object> sortedMap = new TreeMap<>();
                node.fields().forEachRemaining(entry -> {
                    JsonNode val = entry.getValue();
                    if (val.isTextual()) sortedMap.put(entry.getKey(), val.asText());
                    else if (val.isBoolean()) sortedMap.put(entry.getKey(), val.asBoolean());
                    else if (val.isNumber()) sortedMap.put(entry.getKey(), val.numberValue());
                    else if (val.isNull()) sortedMap.put(entry.getKey(), null);
                    else sortedMap.put(entry.getKey(), val.toString());
                });
                normalizedBody = objectMapper.writeValueAsString(sortedMap);
            } else {
                normalizedBody = "{}";
            }

            String payload = normalizedBody + timestamp;
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(apiSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secretKey);
            byte[] hash = hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new OtpManagerException("HMAC_ERROR", "HMAC calculation failed: " + e.getMessage(), 500);
        }
    }

    private <T> T sendRequest(String method, String endpoint, Object body, Class<T> responseType) {
        try {
            String timestamp = String.valueOf(System.currentTimeMillis() / 1000);
            Object bodyToSign = body != null ? body : new TreeMap<>();
            String signature = computeHmac(bodyToSign, timestamp);

            URL url = new URL(serviceUrl + endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod(method);
            conn.setConnectTimeout(timeoutSeconds * 1000);
            conn.setReadTimeout(timeoutSeconds * 1000);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("X-API-Key", apiKey);
            conn.setRequestProperty("X-Signature", signature);
            conn.setRequestProperty("X-Timestamp", timestamp);

            if (body != null && !"GET".equalsIgnoreCase(method)) {
                conn.setDoOutput(true);
                String jsonInput = objectMapper.writeValueAsString(body);
                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonInput.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }
            }

            int statusCode = conn.getResponseCode();
            InputStream stream = (statusCode >= 200 && statusCode < 400) ? conn.getInputStream() : conn.getErrorStream();
            JsonNode root = objectMapper.readTree(stream);

            if (statusCode >= 400) {
                String code = "SERVER_ERROR";
                String message = "An error occurred";
                if (root.has("error")) {
                    JsonNode errNode = root.get("error");
                    if (errNode.has("code")) code = errNode.get("code").asText();
                    if (errNode.has("message")) message = errNode.get("message").asText();
                }
                throw new OtpManagerException(code, message, statusCode);
            }

            JsonNode dataNode = root.has("data") ? root.get("data") : root;
            return objectMapper.treeToValue(dataNode, responseType);
        } catch (OtpManagerException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new OtpManagerException("NETWORK_ERROR", ex.getMessage(), 0);
        }
    }

    /**
     * Starts a new TOTP 2FA enrollment.
     */
    public EnrollResponse enroll(String userId, String email, String name) {
        return sendRequest("POST", "/enroll", new EnrollRequest(userId, email, name), EnrollResponse.class);
    }

    /**
     * Verifies initial 2FA enrollment setup code.
     */
    public VerifyResponse verify(String userId, String code) {
        return sendRequest("POST", "/verify", new VerifyRequest(userId, code), VerifyResponse.class);
    }

    /**
     * Validates a 6-digit TOTP code during login.
     */
    public ValidateResponse validate(String userId, String code) {
        return sendRequest("POST", "/validate", new ValidateRequest(userId, code), ValidateResponse.class);
    }

    /**
     * Gets enrollment status for a user.
     */
    public StatusResponse getStatus(String userId) {
        return sendRequest("GET", "/status/" + userId, null, StatusResponse.class);
    }

    /**
     * Disables 2FA for a user.
     */
    public void disable(String userId) {
        sendRequest("POST", "/disable", new DisableRequest(userId), Object.class);
    }

    /**
     * Resets 2FA secret and generates a new QR code.
     */
    public EnrollResponse reset(String userId) {
        return sendRequest("POST", "/reset", new ResetRequest(userId), EnrollResponse.class);
    }

    /**
     * Bypasses 2FA using a backup recovery code.
     */
    public RecoveryResponse recovery(String userId, String recoveryCode) {
        return sendRequest("POST", "/recovery", new RecoveryRequest(userId, recoveryCode), RecoveryResponse.class);
    }
}
