using AuthResilience.Poc.Server.Models;
using Microsoft.Extensions.Options;

namespace AuthResilience.Poc.Server.Endpoints;

public static class SettingsEndpoints
{
    public static IEndpointRouteBuilder MapSettings(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/settings");

        group.MapGet("/status", GetStatus)
            .WithName("GetStatus")
            .AllowAnonymous(); // Frontend needs this before authentication

        return app;
    }

    private static IResult GetStatus(IOptions<AuthPocSettings> settings)
    {
        var config = settings.Value;
        
        return Results.Ok(new AuthPocStatusResponse
        {
            AuthMode = config.AuthMode,
            IsDrMode = config.AuthMode.Equals("dr", StringComparison.OrdinalIgnoreCase),
            DrMaxTtlMinutes = config.DrMaxTtlMinutes,
            Environment = config.Environment,
            MaintenanceMode = config.MaintenanceMode,
            ApiVersion = config.ApiVersion,
            Timestamp = DateTimeOffset.UtcNow
        });
    }
}
