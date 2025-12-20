using Microsoft.Extensions.Options;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealth(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", (
            IOptions<AuthSettings> auth,
            IOptions<EntraSettings> entra) =>
        {
            return Results.Ok(new
            {
                Status = "Healthy",
                At = DateTimeOffset.UtcNow,

                Auth = new
                {
                    Mode = auth.Value.AuthMode,
                    DrEnabled = auth.Value.DrEnabled,
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
