using AuthResilience.Poc.Server.Models;

public static class WeatherPublicEndpoints
{
    public static IEndpointRouteBuilder MapWeatherPublic(this IEndpointRouteBuilder app)
    {
        app.MapGet("/weather", () =>
        {
            var rng = new Random();
            return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                TemperatureC = rng.Next(-20, 55),
                Summary = WeatherForecast.Summaries[rng.Next(WeatherForecast.Summaries.Length)]
            });
        })
        .WithName("GetWeather")
        .AllowAnonymous();

        return app;
    }
}
