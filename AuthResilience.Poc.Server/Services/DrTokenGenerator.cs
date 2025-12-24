using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuthResilience.Poc.Server.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AuthResilience.Poc.Server.Services;

/// <summary>
/// Service for generating disaster recovery JWT tokens.
/// </summary>
public sealed class DrTokenGenerator
{
    private readonly DrSettings _settings;
    private readonly SigningCredentials _signingCredentials;

    public DrTokenGenerator(IOptions<DrSettings> settings)
    {
        _settings = settings.Value;
        
        var key = Encoding.UTF8.GetBytes(_settings.SigningKey);
        var securityKey = new SymmetricSecurityKey(key);
        _signingCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
    }

    /// <summary>
    /// Generates a JWT token for the specified DR user.
    /// </summary>
    public string GenerateToken(DrUser user, int expiresInMinutes)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Username),
            new(ClaimTypes.Name, user.Name),
            new(JwtRegisteredClaimNames.Sub, user.Username),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Add role claims - this is critical for authorization policies to work
        foreach (var role in user.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
            // Also add as "roles" claim for consistency with Entra tokens
            claims.Add(new Claim("roles", role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiresInMinutes),
            Issuer = _settings.Issuer,
            Audience = _settings.Audience,
            SigningCredentials = _signingCredentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
