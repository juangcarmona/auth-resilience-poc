namespace AuthResilience.Poc.Server.Models;

/// <summary>
/// Response for successful DR login.
/// </summary>
public sealed class DrLoginResponse
{
    public required string AccessToken { get; init; }
    public required string TokenType { get; init; }
    public required int ExpiresIn { get; init; }
    public required string Username { get; init; }
    public required string Name { get; init; }
    public required string[] Roles { get; init; }
}
