package com.otpmanager.client.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * Request and Response DTO models for OTP Manager Java SDK.
 */
public class OtpModels {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class EnrollRequest {
        private String userId;
        private String email;
        private String name;

        public EnrollRequest() {}

        public EnrollRequest(String userId, String email, String name) {
            this.userId = userId;
            this.email = email;
            this.name = name;
        }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EnrollResponse {
        private String enrollmentId;
        private String qrCodeDataUrl;
        private String otpauthUrl;
        private List<String> recoveryCodes;
        private String message;

        public String getEnrollmentId() { return enrollmentId; }
        public void setEnrollmentId(String enrollmentId) { this.enrollmentId = enrollmentId; }
        public String getQrCodeDataUrl() { return qrCodeDataUrl; }
        public void setQrCodeDataUrl(String qrCodeDataUrl) { this.qrCodeDataUrl = qrCodeDataUrl; }
        public String getOtpauthUrl() { return otpauthUrl; }
        public void setOtpauthUrl(String otpauthUrl) { this.otpauthUrl = otpauthUrl; }
        public List<String> getRecoveryCodes() { return recoveryCodes; }
        public void setRecoveryCodes(List<String> recoveryCodes) { this.recoveryCodes = recoveryCodes; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class VerifyRequest {
        private String userId;
        private String code;

        public VerifyRequest() {}
        public VerifyRequest(String userId, String code) {
            this.userId = userId;
            this.code = code;
        }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VerifyResponse {
        private boolean verified;
        private String message;

        public boolean isVerified() { return verified; }
        public void setVerified(boolean verified) { this.verified = verified; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class ValidateRequest {
        private String userId;
        private String code;

        public ValidateRequest() {}
        public ValidateRequest(String userId, String code) {
            this.userId = userId;
            this.code = code;
        }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ValidateResponse {
        private boolean valid;
        private Integer remainingAttempts;

        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }
        public Integer getRemainingAttempts() { return remainingAttempts; }
        public void setRemainingAttempts(Integer remainingAttempts) { this.remainingAttempts = remainingAttempts; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StatusResponse {
        private boolean enrolled;
        private boolean enabled;
        private boolean verified;
        private String lastUsedAt;

        public boolean isEnrolled() { return enrolled; }
        public void setEnrolled(boolean enrolled) { this.enrolled = enrolled; }
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public boolean isVerified() { return verified; }
        public void setVerified(boolean verified) { this.verified = verified; }
        public String getLastUsedAt() { return lastUsedAt; }
        public void setLastUsedAt(String lastUsedAt) { this.lastUsedAt = lastUsedAt; }
    }

    public static class DisableRequest {
        private String userId;

        public DisableRequest() {}
        public DisableRequest(String userId) { this.userId = userId; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
    }

    public static class ResetRequest {
        private String userId;

        public ResetRequest() {}
        public ResetRequest(String userId) { this.userId = userId; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
    }

    public static class RecoveryRequest {
        private String userId;
        private String recoveryCode;

        public RecoveryRequest() {}
        public RecoveryRequest(String userId, String recoveryCode) {
            this.userId = userId;
            this.recoveryCode = recoveryCode;
        }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getRecoveryCode() { return recoveryCode; }
        public void setRecoveryCode(String recoveryCode) { this.recoveryCode = recoveryCode; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RecoveryResponse {
        private boolean valid;
        private int remainingRecoveryCodes;
        private String message;

        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }
        public int getRemainingRecoveryCodes() { return remainingRecoveryCodes; }
        public void setRemainingRecoveryCodes(int remainingRecoveryCodes) { this.remainingRecoveryCodes = remainingRecoveryCodes; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
