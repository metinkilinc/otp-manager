using System.Threading;
using System.Threading.Tasks;
using OtpManager.Client.Models;

namespace OtpManager.Client
{
    /// <summary>
    /// Contract for the OTP Manager SDK client.
    /// </summary>
    public interface IOtpClient
    {
        /// <summary>Starts a new TOTP 2FA enrollment.</summary>
        Task<EnrollResponse> EnrollAsync(string userId, string? email = null, string? name = null, CancellationToken cancellationToken = default);

        /// <summary>Verifies initial 2FA enrollment setup code.</summary>
        Task<VerifyResponse> VerifyAsync(string userId, string code, CancellationToken cancellationToken = default);

        /// <summary>Validates a 6-digit TOTP code during login.</summary>
        Task<ValidateResponse> ValidateAsync(string userId, string code, CancellationToken cancellationToken = default);

        /// <summary>Gets enrollment status for a user.</summary>
        Task<StatusResponse> GetStatusAsync(string userId, CancellationToken cancellationToken = default);

        /// <summary>Disables 2FA for a user.</summary>
        Task DisableAsync(string userId, CancellationToken cancellationToken = default);

        /// <summary>Resets 2FA secret and generates a new QR code.</summary>
        Task<EnrollResponse> ResetAsync(string userId, CancellationToken cancellationToken = default);

        /// <summary>Bypasses 2FA using a backup recovery code.</summary>
        Task<RecoveryResponse> RecoveryAsync(string userId, string recoveryCode, CancellationToken cancellationToken = default);
    }
}
