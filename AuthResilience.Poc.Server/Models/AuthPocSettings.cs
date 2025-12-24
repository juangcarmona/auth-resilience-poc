namespace AuthResilience.Poc.Server.Models;

/// <summary>
/// Application settings that would typically be stored in a database.
/// For this POC, they are loaded from appsettings.json.
/// </summary>
public sealed class AuthPocSettings
{
    public string AuthMode { get; init; } = "normal"; // "normal" | "dr"
    public int DrMaxTtlMinutes { get; init; } = 15;
    public string Environment { get; init; } = "development";
    public bool MaintenanceMode { get; init; } = false;
    public string ApiVersion { get; init; } = "1.0";
}
