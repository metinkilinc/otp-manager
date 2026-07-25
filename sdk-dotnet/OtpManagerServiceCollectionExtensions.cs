using System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace OtpManager.Client
{
    /// <summary>
    /// Extension methods for setting up OTP Manager SDK services in an <see cref="IServiceCollection" />.
    /// </summary>
    public static class OtpManagerServiceCollectionExtensions
    {
        /// <summary>
        /// Registers OTP Manager SDK services in Dependency Injection container using IConfiguration section.
        /// </summary>
        public static IServiceCollection AddOtpManager(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<OtpManagerOptions>(configuration.GetSection("OtpManager"));
            services.AddHttpClient<IOtpClient, OtpClient>();
            return services;
        }

        /// <summary>
        /// Registers OTP Manager SDK services in Dependency Injection container using an action delegate.
        /// </summary>
        public static IServiceCollection AddOtpManager(this IServiceCollection services, Action<OtpManagerOptions> configureOptions)
        {
            services.Configure(configureOptions);
            services.AddHttpClient<IOtpClient, OtpClient>();
            return services;
        }
    }
}
