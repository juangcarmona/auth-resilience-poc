using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();


builder.Services.Configure<AuthSettings>(builder.Configuration);
builder.Services.Configure<EntraSettings>(builder.Configuration);

// AUTHENTICATION
builder.Services
    .AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
        {
            var tenantId = builder.Configuration["ENTRA_TENANT_ID"];
            var audience = builder.Configuration["ENTRA_API_AUDIENCE"];

            options.Authority =
                $"https://login.microsoftonline.com/{tenantId}/v2.0";

            options.Audience = audience;

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidIssuers = new[]
                {
                    $"https://login.microsoftonline.com/{tenantId}/v2.0",
                    $"https://sts.windows.net/{tenantId}/"
                }
            };
        });


// AUTHORIZATION
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CriticalOperator", policy =>
        policy.RequireRole("critical.operator"));
});


var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();



var api  = app.MapGroup("/api");
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/api/openapi/{documentName}.json");

    // Swagger UI (Swashbuckle UI assets)
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/api/openapi/v1.json", "Weather API v1");
        options.RoutePrefix = "swagger";
    });
}
api.MapHealth();
api.MapWeatherPublic();
api.MapWeatherPrivate().RequireAuthorization("CriticalOperator");

app.MapGet("/", () => Results.Redirect("/swagger"));
app.Run();
