public static class WeatherPrivateEndpoints
{
    public static RouteHandlerBuilder MapWeatherPrivate(this IEndpointRouteBuilder app)
    {
        return app.MapPost("/weather/operations/recompute", () =>
        {
            return Results.Ok(new
            {
                Status = "Recalculation triggered",
                At = DateTimeOffset.UtcNow
            });
        })
        .WithName("RecomputeWeather");
    }
}
