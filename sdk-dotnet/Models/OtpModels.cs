using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace OtpManager.Client.Models
{
    /// <summary>
    /// Request model for initiating 2FA enrollment.
    /// </summary>
    public class EnrollRequest
    {
        /// <summary>External User ID in your application.</summary>
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = string.Empty;

        /// <summary>Optional user email.</summary>
        [JsonPropertyName("email")]
        public string? Email { get; set; }

        /// <summary>Optional user full name.</summary>
        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }

    /// <summary>
    /// Response model for 2FA enrollment.
    /// </summary>
    public class EnrollResponse
    {
        /// <summary>Enrollment ID.</summary>
        [JsonPropertyName("enrollmentId")]
        public string EnrollmentId { get; set; } = string.Empty;

        /// <summary>Base64 Data URL for the QR code image.</summary>
        [JsonPropertyName("qrCodeDataUrl")]
        public string QrCodeDataUrl { get; set; } = string.Empty;

        /// <summary>otpauth:// TOTP URI.</summary>
        [JsonPropertyName("otpauthUrl")]
        public string OtpauthUrl { get; set; } = string.Empty;

        /// <summary>One-time backup recovery codes.</summary>
        [JsonPropertyName("recoveryCodes")]
        public List<string>? RecoveryCodes { get; set; }

        /// <summary>Informational message.</summary>
        [JsonPropertyName("message")]
        public string? Message { get; set; }
    }

    /// <summary>
    /// Request model for initial enrollment verification.
    /// </summary>
    public class VerifyRequest
    {
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = string.Empty;

        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response model for initial enrollment verification.
    /// </summary>
    public class VerifyResponse
    {
        [JsonPropertyName("verified")]
        public bool Verified { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }
    }

    /// <summary>
    /// Request model for TOTP validation during login.
    /// </summary>
    public class ValidateRequest
    {
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = string.Empty;

        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response model for TOTP validation.
    /// </summary>
    public class ValidateResponse
    {
        [JsonPropertyName("valid")]
        public bool Valid { get; set; }

        [JsonPropertyName("remainingAttempts")]
        public int? RemainingAttempts { get; set; }
    }

    /// <summary>
    /// Response model for user 2FA status query.
    /// </summary>
    public class StatusResponse
    {
        [JsonPropertyName("enrolled")]
        public bool Enrolled { get; set; }

        [JsonPropertyName("enabled")]
        public bool Enabled { get; set; }

        [JsonPropertyName("verified")]
        public bool Verified { get; set; }

        [JsonPropertyName("lastUsedAt")]
        public string? LastUsedAt { get; set; }
    }

    /// <summary>
    /// Request model for disabling 2FA.
    /// </summary>
    public class DisableRequest
    {
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request model for resetting 2FA.
    /// </summary>
    public class ResetRequest
    {
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request model for recovery code verification.
    /// </summary>
    public class RecoveryRequest
    {
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = string.Empty;

        [JsonPropertyName("recoveryCode")]
        public string RecoveryCode { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response model for recovery code verification.
    /// </summary>
    public class RecoveryResponse
    {
        [JsonPropertyName("valid")]
        public bool Valid { get; set; }

        [JsonPropertyName("remainingRecoveryCodes")]
        public int RemainingRecoveryCodes { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }
    }
}
