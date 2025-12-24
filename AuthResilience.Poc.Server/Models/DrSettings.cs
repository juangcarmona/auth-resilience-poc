namespace AuthResilience.Poc.Server.Models;

/// <summary>
/// Configuration settings for disaster recovery authentication.
/// </summary>
public sealed class DrSettings
{
    public string Issuer { get; init; } = "auth-resilience-dr";
    public string Audience { get; init; } = "auth-resilience-api";
    public string SigningKey { get; init; } = string.Empty;
}
