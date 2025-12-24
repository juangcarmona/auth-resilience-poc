var builder = DistributedApplication.CreateBuilder(args);

/*
 * === PARAMETERS (single source of truth) ===
 */

// Entra ID configuration (required for normal auth mode)
var entraTenantId = builder.AddParameter("entra-tenant-id", secret: true);
var entraSpaClientId = builder.AddParameter("entra-spa-client-id", secret: true);
var entraApiAudience = builder.AddParameter("entra-api-audience", secret: false);

/*
 * === SERVER (API) ===
 */
var server = builder.AddProject<Projects.AuthResilience_Poc_Server>("server")
    .WithHttpHealthCheck("/api/health")
    .WithExternalHttpEndpoints()
    .WithEnvironment("ENTRA_TENANT_ID", entraTenantId)
    .WithEnvironment("ENTRA_API_AUDIENCE", entraApiAudience);

/*
 * === FRONTEND (React / Vite) ===
 */
var webfrontend = builder.AddViteApp("webfrontend", "../frontend")
    .WithReference(server)
    .WaitFor(server)
    .WithEnvironment("PORT", "3000")
    .WithEnvironment("VITE_ENTRA_TENANT_ID", entraTenantId)
    .WithEnvironment("VITE_ENTRA_CLIENT_ID", entraSpaClientId)
    .WithEnvironment("VITE_API_AUDIENCE", entraApiAudience);

server.PublishWithContainerFiles(webfrontend, "wwwroot");

builder.Build().Run();
