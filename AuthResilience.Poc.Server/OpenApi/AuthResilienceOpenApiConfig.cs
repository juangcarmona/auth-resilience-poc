using Microsoft.OpenApi;

namespace AuthResilience.Poc.Server.OpenApi;

public static class AuthResilienceOpenApiConfig
{
    public const string AppName = "auth_poc_api";
    public const string Title = "Auth Resilience POC API";
    public const string Description = "API for Auth Resilience POC platform.";
    public const string Version = "0.2.0";

    public static readonly OpenApiContact Contact = new()
    {
        Name = "Juan G Carmona",
        Email = "juan@jgcarmona.com"
    };

    public static readonly OpenApiLicense License = new()
    {
        Name = "MIT License",
        Url = new Uri("https://opensource.org/licenses/MIT")
    };
}
