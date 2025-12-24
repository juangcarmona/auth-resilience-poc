namespace AuthResilience.Poc.Server.Models;

/// <summary>
/// Represents a disaster recovery user with credentials and roles.
/// For POC purposes only - not for production use.
/// </summary>
public sealed class DrUser
{
    public required string Username { get; init; }
    public required string Password { get; init; }
    public required string Name { get; init; }
    public required string[] Roles { get; init; }
}
