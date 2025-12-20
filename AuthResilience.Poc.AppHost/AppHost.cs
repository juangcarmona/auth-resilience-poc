var builder = DistributedApplication.CreateBuilder(args);

/*
 * === PARAMETERS (single source of truth) ===
 */

// Auth / DR
var authMode = builder.AddParameter(
    name: "auth-mode",
    value: "normal"); // normal | dr

var entraTenantId = builder.AddParameter("entra-tenant-id", secret: true);
var entraSpaClientId = builder.AddParameter("entra-spa-client-id", secret: true);
var entraApiAudience = builder.AddParameter("entra-api-audience", secret: false);

// Optional DR knobs (future-proof, visible)
var drEnabled = builder.AddParameter(
    name: "dr-enabled",
    value: "true");

var drMaxTtlMinutes = builder.AddParameter(
    name: "dr-max-ttl-minutes",
    value: "15");
/*
 * === SERVER (API) ===
 */
var server = builder.AddProject<Projects.AuthResilience_Poc_Server>("server")
    .WithHttpHealthCheck("/api/health")
    .WithExternalHttpEndpoints()
    .WithEnvironment("AUTH_MODE", authMode)
    .WithEnvironment("DR_ENABLED", drEnabled)
    .WithEnvironment("DR_MAX_TTL_MINUTES", drMaxTtlMinutes)
    .WithEnvironment("ENTRA_TENANT_ID", entraTenantId)
    .WithEnvironment("ENTRA_API_AUDIENCE", entraApiAudience);

/*
 * === FRONTEND (React / Vite) ===
 */
var webfrontend = builder.AddViteApp("webfrontend", "../frontend")
    .WithReference(server)
    .WaitFor(server)
    .WithEnvironment("PORT", "3000")
    .WithEnvironment("VITE_AUTH_MODE", authMode)
    .WithEnvironment("VITE_DR_ENABLED", drEnabled)
    .WithEnvironment("VITE_ENTRA_TENANT_ID", entraTenantId)
    .WithEnvironment("VITE_ENTRA_CLIENT_ID", entraSpaClientId)
    .WithEnvironment("VITE_API_AUDIENCE", entraApiAudience);

server.PublishWithContainerFiles(webfrontend, "wwwroot");

builder.Build().Run();
