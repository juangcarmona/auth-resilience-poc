using AuthResilience.Poc.Server.Models;
using AuthResilience.Poc.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AuthResilience.Poc.Server.Endpoints;

public static class DrAuthEndpoints
{
    public static IEndpointRouteBuilder MapDrAuth(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/dr");

        group.MapPost("/login", Login)
            .WithName("DrLogin")
            .AllowAnonymous();

        return app;
    }

    private static IResult Login(
        [FromBody] DrLoginRequest request,
        [FromServices] DrUserStore userStore,
        [FromServices] DrTokenGenerator tokenGenerator,
        [FromServices] IOptions<AuthPocSettings> authSettings)
    {
        // Validate that DR mode is enabled
        var settings = authSettings.Value;
        if (!settings.AuthMode.Equals("dr", StringComparison.OrdinalIgnoreCase))
        {
            return Results.BadRequest(new
            {
                error = "dr_disabled",
                error_description = "Disaster recovery authentication is not enabled"
            });
        }

        // Validate credentials
        var user = userStore.ValidateCredentials(request.Username, request.Password);
        if (user == null)
        {
            return Results.Unauthorized();
        }

        // Generate token with configured TTL
        var expiresInMinutes = settings.DrMaxTtlMinutes > 0 ? settings.DrMaxTtlMinutes : 15;
        var token = tokenGenerator.GenerateToken(user, expiresInMinutes);

        return Results.Ok(new DrLoginResponse
        {
            AccessToken = token,
            TokenType = "Bearer",
            ExpiresIn = expiresInMinutes * 60, // Return seconds
            Username = user.Username,
            Name = user.Name,
            Roles = user.Roles
        });
    }
}
