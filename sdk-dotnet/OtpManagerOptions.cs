namespace OtpManager.Client
{
    /// <summary>
    /// OTP Manager C# SDK configuration options.
    /// </summary>
    public class OtpManagerOptions
    {
        /// <summary>
        /// Gets or sets the base URL of the OTP Manager service (e.g., "https://otp.yourcompany.com").
        /// </summary>
        public string BaseUrl { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the application API Key.
        /// </summary>
        public string ApiKey { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the application API Secret used for HMAC-SHA256 signing.
        /// </summary>
        public string ApiSecret { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets HTTP request timeout in seconds. Default is 10 seconds.
        /// </summary>
        public int TimeoutSeconds { get; set; } = 10;
    }
}
