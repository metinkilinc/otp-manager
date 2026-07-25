using System;

namespace OtpManager.Client
{
    /// <summary>
    /// Strongly typed exception thrown by the OTP Manager SDK.
    /// </summary>
    public class OtpManagerException : Exception
    {
        /// <summary>
        /// Gets the OTP Manager error code (e.g. "INVALID_TOKEN", "ACCOUNT_LOCKED").
        /// </summary>
        public string Code { get; }

        /// <summary>
        /// Gets the HTTP Status Code associated with the error.
        /// </summary>
        public int StatusCode { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="OtpManagerException"/> class.
        /// </summary>
        public OtpManagerException(string code, string message, int statusCode = 400)
            : base($"[{code}] {message} (HTTP {statusCode})")
        {
            Code = code;
            StatusCode = statusCode;
        }
    }
}
