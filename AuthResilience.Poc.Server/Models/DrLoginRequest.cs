namespace AuthResilience.Poc.Server.Models;

/// <summary>
/// Request payload for DR login endpoint.
/// </summary>
public sealed class DrLoginRequest
{
    public required string Username { get; init; }
    public required string Password { get; init; }
}
