using AuthResilience.Poc.Server.Models;
using Microsoft.Extensions.Options;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealth(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", (
            IOptions<AuthPocSettings> auth,
            IOptions<EntraSettings> entra) =>
        {
            return Results.Ok(new
            {
                Status = "Healthy",
                At = DateTimeOffset.UtcNow,

                Auth = new
                {
                    Mode = auth.Value.AuthMode,
                    DrMaxTtlMinutes = auth.Value.DrMaxTtlMinutes
                },

                Identity = new
                {
                    Provider = "Federated",
                    Authority = entra.Value.Authority
                }
            });
        })
        .WithName("Health")
        .AllowAnonymous();

        return app;
    }
}
