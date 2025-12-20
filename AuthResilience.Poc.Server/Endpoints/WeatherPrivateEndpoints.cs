using System.Security.Claims;

public static class WeatherPrivateEndpoints
{
    public static RouteHandlerBuilder MapWeatherPrivate(this IEndpointRouteBuilder app)
    {
        return app.MapPost(
            "/weather/operations/recompute",
            (
                WeatherRecomputeRequest? request,
                ClaimsPrincipal user
            ) =>
            {
                request ??= new WeatherRecomputeRequest();

                var isAdvanced = request.HasAdvancedOptions;
                var isTuner = user.IsInRole("weather.tuner");

                if (isAdvanced && !isTuner)
                {
                    return Results.Forbid();
                }

                // Defaults (server-owned)
                var days = request.Days ?? 7;
                var resolution = request.Resolution ?? "medium";
                var model = request.Model ?? "standard";
                
                // Simulate recomputation logic...
                // In a real implementation, this would trigger background processing, etc.
                // For this example, we just return a confirmation response.

                return Results.Ok(new
                {
                    Status = "Recalculation triggered",
                    Mode = isAdvanced ? "advanced" : "default",
                    Parameters = new
                    {
                        Days = days,
                        Resolution = resolution,
                        Model = model
                    },
                    At = DateTimeOffset.UtcNow
                });
            })
            .RequireAuthorization("CriticalOperator")
            .WithName("RecomputeWeather");
    }
}
