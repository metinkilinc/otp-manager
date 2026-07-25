using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using OtpManager.Client.Models;

namespace OtpManager.Client
{
    /// <summary>
    /// Official C# / .NET SDK Client for OTP Manager service.
    /// </summary>
    public class OtpClient : IOtpClient
    {
        private readonly HttpClient _httpClient;
        private readonly OtpManagerOptions _options;

        /// <summary>
        /// Initializes a new instance of the <see cref="OtpClient"/> class using standalone options.
        /// </summary>
        public OtpClient(OtpManagerOptions options, HttpClient? httpClient = null)
        {
            _options = options ?? throw new ArgumentNullException(nameof(options));
            if (string.IsNullOrWhiteSpace(_options.BaseUrl))
                throw new ArgumentException("BaseUrl is required", nameof(options));
            if (string.IsNullOrWhiteSpace(_options.ApiKey))
                throw new ArgumentException("ApiKey is required", nameof(options));
            if (string.IsNullOrWhiteSpace(_options.ApiSecret))
                throw new ArgumentException("ApiSecret is required", nameof(options));

            _httpClient = httpClient ?? new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds > 0 ? _options.TimeoutSeconds : 10);
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="OtpClient"/> class for Dependency Injection.
        /// </summary>
        public OtpClient(IOptions<OtpManagerOptions> optionsAccessor, HttpClient httpClient)
            : this(optionsAccessor.Value, httpClient)
        {
        }

        /// <summary>
        /// Normalizes request body keys and computes HMAC-SHA256 signature according to Node.js server specification.
        /// </summary>
        private static string ComputeHmac(object? body, string timestamp, string apiSecret)
        {
            string normalizedBody;
            if (body != null)
            {
                var jsonStr = JsonSerializer.Serialize(body);
                using var doc = JsonDocument.Parse(jsonStr);
                var sortedDict = new SortedDictionary<string, object?>();

                foreach (var prop in doc.RootElement.EnumerateObject())
                {
                    sortedDict[prop.Name] = prop.Value.ValueKind switch
                    {
                        JsonValueKind.String => prop.Value.GetString(),
                        JsonValueKind.Number => prop.Value.GetRawText(),
                        JsonValueKind.True => true,
                        JsonValueKind.False => false,
                        JsonValueKind.Null => null,
                        _ => prop.Value.GetRawText()
                    };
                }
                normalizedBody = JsonSerializer.Serialize(sortedDict);
            }
            else
            {
                normalizedBody = "{}";
            }

            var payload = normalizedBody + timestamp;
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(apiSecret));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));

            var sb = new StringBuilder(hashBytes.Length * 2);
            foreach (var b in hashBytes)
            {
                sb.Append(b.ToString("x2"));
            }
            return sb.ToString();
        }

        private async Task<TResponse> SendRequestAsync<TResponse>(HttpMethod method, string endpoint, object? body = null, CancellationToken cancellationToken = default)
        {
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var bodyToSign = body ?? new { };
            var signature = ComputeHmac(bodyToSign, timestamp, _options.ApiSecret);

            var baseUrl = _options.BaseUrl.TrimEnd('/') + "/api/v1/totp";
            var requestUrl = $"{baseUrl}{endpoint}";

            using var request = new HttpRequestMessage(method, requestUrl);
            request.Headers.Add("X-API-Key", _options.ApiKey);
            request.Headers.Add("X-Signature", signature);
            request.Headers.Add("X-Timestamp", timestamp);

            if (body != null && method != HttpMethod.Get)
            {
                var jsonBody = JsonSerializer.Serialize(body);
                request.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");
            }

            try
            {
                using var response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
                var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;

                if (!response.IsSuccessStatusCode)
                {
                    string code = "SERVER_ERROR";
                    string message = "An error occurred";
                    if (root.TryGetProperty("error", out var errObj))
                    {
                        if (errObj.TryGetProperty("code", out var c)) code = c.GetString() ?? code;
                        if (errObj.TryGetProperty("message", out var m)) message = m.GetString() ?? message;
                    }
                    throw new OtpManagerException(code, message, (int)response.StatusCode);
                }

                if (root.TryGetProperty("data", out var dataObj))
                {
                    return JsonSerializer.Deserialize<TResponse>(dataObj.GetRawText())!;
                }

                return JsonSerializer.Deserialize<TResponse>(content)!;
            }
            catch (HttpRequestException ex)
            {
                throw new OtpManagerException("NETWORK_ERROR", ex.Message, 0);
            }
        }

        /// <inheritdoc />
        public Task<EnrollResponse> EnrollAsync(string userId, string? email = null, string? name = null, CancellationToken cancellationToken = default)
        {
            var body = new Dictionary<string, object?>
            {
                ["userId"] = userId
            };
            if (!string.IsNullOrEmpty(email)) body["email"] = email;
            if (!string.IsNullOrEmpty(name)) body["name"] = name;

            return SendRequestAsync<EnrollResponse>(HttpMethod.Post, "/enroll", body, cancellationToken);
        }

        /// <inheritdoc />
        public Task<VerifyResponse> VerifyAsync(string userId, string code, CancellationToken cancellationToken = default)
        {
            var body = new { userId, code };
            return SendRequestAsync<VerifyResponse>(HttpMethod.Post, "/verify", body, cancellationToken);
        }

        /// <inheritdoc />
        public Task<ValidateResponse> ValidateAsync(string userId, string code, CancellationToken cancellationToken = default)
        {
            var body = new { userId, code };
            return SendRequestAsync<ValidateResponse>(HttpMethod.Post, "/validate", body, cancellationToken);
        }

        /// <inheritdoc />
        public Task<StatusResponse> GetStatusAsync(string userId, CancellationToken cancellationToken = default)
        {
            return SendRequestAsync<StatusResponse>(HttpMethod.Get, $"/status/{Uri.EscapeDataString(userId)}", null, cancellationToken);
        }

        /// <inheritdoc />
        public async Task DisableAsync(string userId, CancellationToken cancellationToken = default)
        {
            var body = new { userId };
            await SendRequestAsync<object>(HttpMethod.Post, "/disable", body, cancellationToken).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public Task<EnrollResponse> ResetAsync(string userId, CancellationToken cancellationToken = default)
        {
            var body = new { userId };
            return SendRequestAsync<EnrollResponse>(HttpMethod.Post, "/reset", body, cancellationToken);
        }

        /// <inheritdoc />
        public Task<RecoveryResponse> RecoveryAsync(string userId, string recoveryCode, CancellationToken cancellationToken = default)
        {
            var body = new { userId, recoveryCode };
            return SendRequestAsync<RecoveryResponse>(HttpMethod.Post, "/recovery", body, cancellationToken);
        }
    }
}
