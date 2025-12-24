# Backend Implementation

ASP.NET Core API with dual JWT Bearer authentication schemes.

## Architecture

### Dual Authentication Schemes

**Implementation:** [Configuration/AuthenticationExtensions.cs](AuthResilience.Poc.Server/Configuration/AuthenticationExtensions.cs)

Two JWT Bearer schemes run simultaneously:

1. **EntraBearer** (Normal Mode)
   - Azure Entra ID token validation
   - Authority: `https://login.microsoftonline.com/{tenantId}/v2.0`
   - Validates tokens against Entra's public keys
   - Role claims from `roles` array

2. **DrBearer** (Disaster Recovery)
   - Custom JWT with symmetric signing (HMAC-SHA256)
   - Issuer: `auth-resilience-dr`
   - Validates tokens with local signing key
   - Role claims from standard claim type

### Scheme Selection Logic

See `DetermineDefaultScheme()` in [AuthenticationExtensions.cs](AuthResilience.Poc.Server/Configuration/AuthenticationExtensions.cs)

Default scheme selected at startup based on `AuthPocSettings.AuthMode`:
- `"normal"` → EntraBearer
- `"dr"` → DrBearer

Both schemes remain configured; the default determines which is tried first.

### Authorization Policies

Defined in [Program.cs](AuthResilience.Poc.Server/Program.cs) - works with both schemes:

- **CriticalOperator** - Requires `critical.operator` role
- **WeatherTuner** - Requires `weather.tuner` role

## Configuration

### Settings Model

[Models/AuthPocSettings.cs](AuthResilience.Poc.Server/Models/AuthPocSettings.cs) - Simulates database-stored configuration

**appsettings.Development.json:**
```json
{
  "AuthPocSettings": {
    "AuthMode": "normal",
    "DrMaxTtlMinutes": 15,
    "Environment": "development",
    "MaintenanceMode": false,
    "ApiVersion": "1.0"
  },
  "DrSettings": {
    "Issuer": "auth-resilience-dr",
    "Audience": "auth-resilience-api",
    "SigningKey": "your-256-bit-secret-key-min-32-chars!!"
  }
}
```

### DR Users

**Service:** [Services/DrUserStore.cs](AuthResilience.Poc.Server/Services/DrUserStore.cs)

In-memory hardcoded users:

| Username | Password | Roles |
|----------|----------|-------|
| admin | Admin123! | critical.operator, weather.tuner |
| operator | Operator123! | critical.operator |
| tuner | Tuner123! | weather.tuner |

⚠️ **POC Only:** Production needs encrypted database, hashed passwords.

## Endpoints

### Settings

**Implementation:** [Endpoints/SettingsEndpoints.cs](AuthResilience.Poc.Server/Endpoints/SettingsEndpoints.cs)

#### GET /api/settings/status

Returns current authentication mode. Used by frontend for strategy selection.

**Response:**
```json
{
  "authMode": "dr",
  "isDrMode": true,
  "drMaxTtlMinutes": 15,
  "environment": "development",
  "maintenanceMode": false,
  "apiVersion": "1.0",
  "timestamp": "2025-12-24T10:30:00Z"
}
```

### DR Authentication

**Implementation:** [Endpoints/DrAuthEndpoints.cs](AuthResilience.Poc.Server/Endpoints/DrAuthEndpoints.cs)

#### POST /api/dr/login

Authenticates DR users, returns JWT.

**Request:**
```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

**Success (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "username": "admin",
  "name": "DR Administrator",
  "roles": ["critical.operator", "weather.tuner"]
}
```

**Errors:**
- `400` - DR mode not enabled (`AuthMode != "dr"`)
- `401` - Invalid credentials

**Token Generation:** [Services/DrTokenGenerator.cs](AuthResilience.Poc.Server/Services/DrTokenGenerator.cs)

### Weather

**Public:** [Endpoints/WeatherPublicEndpoints.cs](AuthResilience.Poc.Server/Endpoints/WeatherPublicEndpoints.cs)
- `GET /api/weather` - No auth required

**Protected:** [Endpoints/WeatherPrivateEndpoints.cs](AuthResilience.Poc.Server/Endpoints/WeatherPrivateEndpoints.cs)
- `GET /api/weather/private` - Requires `critical.operator` role
- `POST /api/weather/operations/recompute` - Critical operation with optional tuner params

### Health

**Implementation:** [Endpoints/HealthEndpoints.cs](AuthResilience.Poc.Server/Endpoints/HealthEndpoints.cs)

- `GET /api/health` - Health check with config info

## Testing

### Check Current Mode
```powershell
Invoke-RestMethod http://localhost:5000/api/settings/status
```

### DR Login
```powershell
$response = Invoke-RestMethod -Uri http://localhost:5000/api/dr/login `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"Admin123!"}'

$token = $response.accessToken
```

### Call Protected Endpoint
```powershell
Invoke-RestMethod http://localhost:5000/api/weather/private `
  -Headers @{Authorization = "Bearer $token"}
```

### Test Authorization
```powershell
# Admin (has critical.operator) - succeeds
$adminToken = (Invoke-RestMethod ... -Body '{"username":"admin",...}').accessToken

# Tuner (lacks critical.operator) - returns 403
$tunerToken = (Invoke-RestMethod ... -Body '{"username":"tuner",...}').accessToken
```

## Role Claim Mapping

**Critical for cross-scheme compatibility:**

**Entra tokens:** Roles in `roles` array  
**DR tokens:** Roles in `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`

Both mapped via `RoleClaimType` in scheme configuration. Authorization policies work identically.

## Security Considerations

### POC Limitations

❌ Plain text passwords (`DrUserStore.ValidateCredentials`)  
❌ Hardcoded users in memory  
❌ Symmetric key in configuration file  
❌ No rate limiting on `/api/dr/login`  
❌ No refresh tokens  
❌ No password policies  
❌ No audit logging  
❌ No MFA/2FA  

### Production Requirements

**Authentication:**
- Certificate-based auth for DR users
- Password hashing (bcrypt, Argon2 with salt)
- Encrypted database for user storage
- Azure Key Vault for signing keys
- HSM for cryptographic operations

**Security:**
- Rate limiting (10 failed attempts → lockout)
- Account lockout policies
- Audit log for all auth events
- Session management & revocation
- IP allowlisting for DR endpoints

**Tokens:**
- Refresh token rotation
- Shorter access token lifetimes (5-15 min)
- Token revocation endpoint
- JWT ID (jti) claim tracking

**Monitoring:**
- Failed authentication alerts
- DR mode activation alerts
- Anomaly detection
- Security event logging to SIEM

## Aspire Integration

**Orchestration:** [AuthResilience.Poc.AppHost/AppHost.cs](AuthResilience.Poc.AppHost/AppHost.cs)

**Configuration Flow:**
1. Aspire prompts for Entra parameters (tenant ID, client ID, audience)
2. Parameters passed as environment variables to server
3. Server reads `AuthPocSettings` from appsettings.json
4. Server configures both schemes at startup
5. Frontend environment variables set by Aspire

**No auth mode passed from Aspire** - determined by server settings only.

## Key Implementation Details

### Authentication Extension

See `AddAuthResilienceAuthentication()` in [AuthenticationExtensions.cs](AuthResilience.Poc.Server/Configuration/AuthenticationExtensions.cs)

Explicit pattern:
1. Read settings from configuration
2. Determine default scheme via helper method
3. Register authentication with default
4. Add both Entra and DR schemes
5. Configure scheme-specific validators

### Token Validation

**Entra:** Uses Microsoft's JWT handler, validates against Entra's OIDC metadata  
**DR:** Symmetric key validation, explicit issuer/audience checks

### Role Claims

Both schemes populate `ClaimsIdentity` with role claims. ASP.NET Core's authorization system reads from either claim type via `RoleClaimType` configuration.

## Project Structure

```
AuthResilience.Poc.Server/
├── Configuration/
│   └── AuthenticationExtensions.cs    # Dual scheme setup
├── Endpoints/
│   ├── DrAuthEndpoints.cs            # DR login
│   ├── SettingsEndpoints.cs          # Status endpoint
│   ├── HealthEndpoints.cs            # Health check
│   ├── WeatherPublicEndpoints.cs     # Public API
│   └── WeatherPrivateEndpoints.cs    # Protected API
├── Models/
│   ├── AuthPocSettings.cs            # App settings model
│   ├── EntraSettings.cs              # Entra config
│   ├── DrUser.cs                     # DR user model
│   └── WeatherForecast.cs            # Domain models
├── Services/
│   ├── DrUserStore.cs                # In-memory users
│   └── DrTokenGenerator.cs           # JWT generation
├── Program.cs                        # Startup config
└── appsettings.Development.json      # Configuration
```

## Switching Modes

**Edit:** `appsettings.Development.json` → `AuthPocSettings.AuthMode`  
**Restart:** Application (scheme selection happens at startup)  
**Verify:** Call `/api/settings/status`

No code changes needed to switch between modes.
