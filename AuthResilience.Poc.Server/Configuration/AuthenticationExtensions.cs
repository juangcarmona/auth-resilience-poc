using AuthResilience.Poc.Server.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace AuthResilience.Poc.Server.Configuration;

public static class AuthenticationExtensions
{
    public const string EntraBearerScheme = "EntraBearer";
    public const string DrBearerScheme = "DrBearer";

    /// <summary>
    /// Configures dual authentication schemes (Entra and DR) based on AuthPocSettings.
    /// </summary>
    public static IServiceCollection AddAuthResilienceAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Load settings to determine which scheme should be default
        var authSettings = configuration
            .GetSection("AuthPocSettings")
            .Get<AuthPocSettings>() ?? new AuthPocSettings();

        // Explicitly determine the default scheme
        var defaultScheme = DetermineDefaultScheme(authSettings);

        services
            .AddAuthentication(defaultScheme)
            .AddEntraBearerAuthentication(configuration)
            .AddDrBearerAuthentication(configuration);

        return services;
    }

    /// <summary>
    /// Explicitly determines which authentication scheme should be used.
    /// </summary>
    private static string DetermineDefaultScheme(AuthPocSettings settings)
    {
        // Explicit logic: if DR mode is enabled, use DR scheme
        var isDrMode = settings.AuthMode.Equals("dr", StringComparison.OrdinalIgnoreCase);
        
        return isDrMode ? DrBearerScheme : EntraBearerScheme;
    }

    /// <summary>
    /// Adds Entra ID (Azure AD) JWT Bearer authentication.
    /// </summary>
    private static AuthenticationBuilder AddEntraBearerAuthentication(
        this AuthenticationBuilder builder,
        IConfiguration configuration)
    {
        return builder.AddJwtBearer(EntraBearerScheme, options =>
        {
            var tenantId = configuration["ENTRA_TENANT_ID"];
            var audience = configuration["ENTRA_API_AUDIENCE"];

            options.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
            options.Audience = audience;

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidIssuers = new[]
                {
                    $"https://login.microsoftonline.com/{tenantId}/v2.0",
                    $"https://sts.windows.net/{tenantId}/"
                },
                // RoleClaimType = "roles" // Entra uses 'roles' claim
            };
        });
    }

    /// <summary>
    /// Adds Disaster Recovery JWT Bearer authentication.
    /// </summary>
    private static AuthenticationBuilder AddDrBearerAuthentication(
        this AuthenticationBuilder builder,
        IConfiguration configuration)
    {
        return builder.AddJwtBearer(DrBearerScheme, options =>
        {
            var drSettings = configuration.GetSection("DrSettings");
            var issuer = drSettings["Issuer"] ?? "auth-resilience-dr";
            var audience = drSettings["Audience"] ?? "auth-resilience-api";
            var signingKey = drSettings["SigningKey"] ?? "your-256-bit-secret-key-min-32-chars!!";

            var key = Encoding.UTF8.GetBytes(signingKey);

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            };
        });
    }
}
