namespace AuthResilience.Poc.Server.Models;

/// <summary>
/// Response model for the settings/status endpoint.
/// Tells clients how to authenticate and what features are available.
/// </summary>
public sealed class AuthPocStatusResponse
{
    public required string AuthMode { get; init; }
    public required bool IsDrMode { get; init; }
    public required int DrMaxTtlMinutes { get; init; }
    public required string Environment { get; init; }
    public required bool MaintenanceMode { get; init; }
    public required string ApiVersion { get; init; }
    public required DateTimeOffset Timestamp { get; init; }
}
