using System.Text;
using AuthResilience.Poc.Server.Configuration;
using AuthResilience.Poc.Server.Endpoints;
using AuthResilience.Poc.Server.Models;
using AuthResilience.Poc.Server.OpenApi;
using AuthResilience.Poc.Server.Services;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(options =>
{
    // keep your existing transformer
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});

builder.Services.Configure<AuthPocSettings>(builder.Configuration.GetSection("AuthPocSettings"));
builder.Services.Configure<EntraSettings>(builder.Configuration);
builder.Services.Configure<DrSettings>(builder.Configuration.GetSection("DrSettings"));

// Register DR services
builder.Services.AddSingleton<DrUserStore>();
builder.Services.AddSingleton<DrTokenGenerator>();

// AUTHENTICATION - Explicitly configure based on AuthPocSettings
builder.Services.AddAuthResilienceAuthentication(builder.Configuration);

// AUTHORIZATION
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CriticalOperator", policy =>
        policy.RequireRole("critical.operator"));
    options.AddPolicy("WeatherTuner", policy =>
        policy.RequireRole("weather.tuner"));
});


var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();



var api = app.MapGroup("/api");

api.MapHealth();
api.MapSettings();
api.MapWeatherPublic();
api.MapWeatherPrivate().RequireAuthorization("CriticalOperator");
api.MapDrAuth();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/api/openapi/{documentName}.json");

    // Swagger UI (Swashbuckle UI assets)
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/api/openapi/v1.json", "Weather API v1");
        options.RoutePrefix = "swagger";
        options.OAuthClientId("swagger-ui");
        options.OAuthClientSecret("swagger-ui-secret");
        options.OAuthUsePkce();
    });
}
app.MapGet("/", () => Results.Redirect("/swagger"));
app.Run();
