using AuthResilience.Poc.Server.Models;

namespace AuthResilience.Poc.Server.Services;

/// <summary>
/// In-memory store for disaster recovery users.
/// For POC purposes only - not for production use.
/// </summary>
public sealed class DrUserStore
{
    private readonly Dictionary<string, DrUser> _users;

    public DrUserStore()
    {
        // Hardcoded DR users with roles matching Entra roles
        _users = new Dictionary<string, DrUser>(StringComparer.OrdinalIgnoreCase)
        {
            ["admin"] = new DrUser
            {
                Username = "admin",
                Password = "Admin123!",
                Name = "DR Administrator",
                Roles = ["critical.operator", "weather.tuner"]
            },
            ["operator"] = new DrUser
            {
                Username = "operator",
                Password = "Operator123!",
                Name = "DR Operator",
                Roles = ["critical.operator"]
            },
            ["tuner"] = new DrUser
            {
                Username = "tuner",
                Password = "Tuner123!",
                Name = "DR Weather Tuner",
                Roles = ["weather.tuner"]
            }
        };
    }

    /// <summary>
    /// Validates user credentials and returns the user if valid.
    /// </summary>
    public DrUser? ValidateCredentials(string username, string password)
    {
        if (!_users.TryGetValue(username, out var user))
        {
            return null;
        }

        // In a POC, we use plain text comparison.
        // Production would use proper password hashing (bcrypt, Argon2, etc.).
        if (user.Password != password)
        {
            return null;
        }

        return user;
    }
}
