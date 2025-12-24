# Auth Resilience POC (Aspire + Entra ID + DR Fallback)

This repository contains a **.NET Aspire demo** that shows how to run a **React SPA + ASP.NET Core API** using **your own Azure Entra ID tenant** for authentication and **role-based authorization**, with a **Disaster Recovery (DR) authentication mode** as a fallback when Entra ID is unavailable.

The focus is **identity wiring and resilience**, not UI polish.

---

## What this demo shows

* Real Azure Entra ID integration (no mocks)
* SPA authentication using **MSAL (Authorization Code Flow + PKCE)**
* API authentication using **JWT Bearer**
* **App role–based authorization** for critical operations
* **Dual authentication schemes**: Entra ID (normal) and DR (fallback)
* **Settings-based configuration** simulating database-stored settings
* **Status endpoint** for clients to detect current authentication mode
* Centralized configuration via **Aspire AppHost**

---

## Authentication Architecture

### Dual JWT Bearer Schemes

The API runs **two authentication schemes simultaneously**:

1. **EntraBearer** (Normal Mode)
   - Azure Entra ID token validation
   - Authority: `https://login.microsoftonline.com/{tenantId}/v2.0`
   - OAuth 2.0 / OpenID Connect
   - Production-grade identity management
   - Role claims from `roles` array in JWT

2. **DrBearer** (Disaster Recovery)
   - Locally-issued JWT tokens
   - Issuer: `auth-resilience-dr`
   - HMAC-SHA256 symmetric key signing
   - In-memory user store (hardcoded)
   - Same role structure as Entra
   - **POC only** - not production-ready

### Scheme Selection

The default authentication scheme is determined at startup by reading `AuthPocSettings.AuthMode` from configuration:

```csharp
// Configuration/AuthenticationExtensions.cs
public static IServiceCollection AddAuthResilienceAuthentication(
    this IServiceCollection services,
    IConfiguration configuration)
{
    var authSettings = configuration
        .GetSection("AuthPocSettings")
        .Get<AuthPocSettings>() ?? new AuthPocSettings();

    var defaultScheme = DetermineDefaultScheme(authSettings);
    
    services
        .AddAuthentication(defaultScheme)
        .AddEntraBearerAuthentication(configuration)
        .AddDrBearerAuthentication(configuration);
}

private static string DetermineDefaultScheme(AuthPocSettings settings)
{
    var isDrMode = settings.AuthMode.Equals("dr", StringComparison.OrdinalIgnoreCase);
    return isDrMode ? "DrBearer" : "EntraBearer";
}
```

### Authorization

**No duplication needed.** Existing authorization policies work with both schemes:

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CriticalOperator", policy =>
        policy.RequireRole("critical.operator"));
    options.AddPolicy("WeatherTuner", policy => 
        policy.RequireRole("weather.tuner"));
});
```

Both schemes populate role claims correctly, so `RequireRole()` and `user.IsInRole()` work identically.

---

## Configuration

### Settings Model (Database Simulation)

Authentication mode and settings are configured via `appsettings.Development.json`, simulating database-stored configuration:

```json
{
  "AuthPocSettings": {
    "AuthMode": "normal",        // "normal" or "dr"
    "DrMaxTtlMinutes": 15,       // DR token lifetime
    "Environment": "development",
    "MaintenanceMode": false,
    "ApiVersion": "1.0"
  },
  "DrSettings": {
    "Issuer": "auth-resilience-dr",
    "Audience": "auth-resilience-api",
    "SigningKey": "your-256-bit-secret-key-change-in-production!!"
  }
}
```

**Switch to DR mode:** Change `AuthMode` to `"dr"` and restart.

### DR Users (Hardcoded)

When in DR mode, these users are available:

| Username | Password | Roles |
|----------|----------|-------|
| admin | Admin123! | critical.operator, weather.tuner |
| operator | Operator123! | critical.operator |
| tuner | Tuner123! | weather.tuner |

⚠️ **POC Only:** Plain text passwords, in-memory storage. Production requires proper password hashing and persistent storage.

---

## API Endpoints

### Public Endpoints

#### GET /api/settings/status
Returns current authentication mode and application settings. Used by frontend to determine authentication strategy.

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

#### POST /api/dr/login
Authenticates DR users and returns JWT token. **Only active when `AuthMode=dr`.**

**Request:**
```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

**Response (200):**
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
- `400`: DR mode not enabled
- `401`: Invalid credentials

#### GET /api/weather
Public weather data (no authentication required)

### Protected Endpoints

#### GET /api/weather/private
Requires `critical.operator` role. Returns sensitive weather operations data.

#### GET /api/health
Health check with configuration details.

---

## Entra ID Requirements

You need an Entra ID tenant with:

### App Registrations

* **SPA application** (React frontend)
* **API application** (ASP.NET Core backend)

### API Configuration

* Application ID URI (e.g. `api://<api-client-id>`)
* App roles:
  ```
  critical.operator  - Required to execute recompute operations
  weather.tuner      - Optional, enables advanced parameter controls
  ```
* Delegated scope:
  ```
  access_as_user
  ```

### User Assignment

* Assign the `critical.operator` role to users who need to execute critical operations
* Optionally assign the `weather.tuner` role to power users who need fine-grained control

---

## Running Locally

### 1. Configure Authentication Mode

Edit `AuthResilience.Poc.Server/appsettings.Development.json`:

```json
{
  "AuthPocSettings": {
    "AuthMode": "normal",  // or "dr" for disaster recovery
    ...
  }
}
```

### 2. Run Aspire AppHost

```bash
cd AuthResilience.Poc.AppHost
dotnet run
```

### 3. Provide Entra ID Parameters

When prompted:
* `entra-tenant-id`: Your Azure tenant ID
* `entra-spa-client-id`: SPA application client ID
* `entra-api-audience`: API application ID URI

Aspire will start:
* The API (with health checks)
* The React frontend
* Service discovery and wiring

### 4. Access the Application

* **Aspire Dashboard**: Displayed in console output
* **API Swagger**: `http://localhost:{api-port}/swagger`
* **Frontend**: `http://localhost:3000`

---

## Frontend Integration Pattern

The frontend should call `/api/settings/status` on load to determine authentication strategy:

```typescript
// Pseudo-code
const status = await fetch('/api/settings/status').then(r => r.json());

if (status.isDrMode) {
  // Show username/password login form
  // POST credentials to /api/dr/login
  // Store returned JWT token
} else {
  // Use MSAL for Entra ID authentication
  // Redirect to OAuth flow
}
```

This allows the frontend to **dynamically adapt** to the backend's authentication mode without hardcoding.

---

## Role-Based Features

### All Authenticated Users
* View weather forecasts
* Access public endpoints

### Users with `critical.operator` Role
* Execute "Recompute Weather Data" operation
* Access `/api/weather/private` endpoint

### Users with Both `critical.operator` and `weather.tuner` Roles
* All `critical.operator` capabilities
* Access "Advanced Options" panel to customize:
  - **Days**: Number of days to recompute (1-30)
  - **Resolution**: Data resolution level (low/medium/high)
  - **Model**: Computation model (standard/experimental)

The advanced options panel is only visible to users with the `weather.tuner` role, demonstrating fine-grained role-based UI capabilities.

---

## Testing DR Mode

### 1. Enable DR Mode
Edit `appsettings.Development.json`:
```json
{ "AuthPocSettings": { "AuthMode": "dr" } }
```

Restart the application.

### 2. Check Status
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/settings/status"
```

### 3. Login
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/dr/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"Admin123!"}'

$token = $response.accessToken
```

### 4. Call Protected Endpoint
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/weather/private" `
  -Headers @{Authorization = "Bearer $token"}
```

### 5. Test Authorization
```powershell
# Admin (has critical.operator) - Should succeed
$adminToken = (Invoke-RestMethod -Uri "http://localhost:5000/api/dr/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"username":"admin","password":"Admin123!"}').accessToken

Invoke-RestMethod -Uri "http://localhost:5000/api/weather/private" `
  -Headers @{Authorization = "Bearer $adminToken"}

# Tuner (lacks critical.operator) - Should return 403 Forbidden
$tunerToken = (Invoke-RestMethod -Uri "http://localhost:5000/api/dr/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"username":"tuner","password":"Tuner123!"}').accessToken

Invoke-RestMethod -Uri "http://localhost:5000/api/weather/private" `
  -Headers @{Authorization = "Bearer $tunerToken"}
```

---

## Security Considerations

### DR Mode Limitations (POC Only)

⚠️ **This DR implementation is for PROOF OF CONCEPT only. NOT production-ready.**

**Current limitations:**
1. ❌ **Plain text passwords** - Use bcrypt/Argon2 in production
2. ❌ **Hardcoded users** - Use database or external identity provider
3. ❌ **Symmetric key in config** - Use Azure Key Vault or HSM
4. ❌ **No rate limiting** - Add login attempt throttling
5. ❌ **No refresh tokens** - Implement for better UX
6. ❌ **No password policies** - Add complexity requirements
7. ❌ **No audit logging** - Log all authentication events
8. ❌ **No MFA** - Consider for critical operations

### Production Recommendations

For a production DR solution:
- Use **certificate-based authentication** for critical users
- Implement **password hashing** (bcrypt, Argon2)
- Store users in **encrypted database**
- Add **audit logging** for all DR authentications
- Implement **rate limiting** and **account lockout**
- Use **hardware security modules** (HSM) for key storage
- Add **MFA/2FA** support
- Implement **refresh tokens** with rotation
- Add **session management** and revocation

---

## Project Structure

```
AuthResilience.Poc.Server/
├── Configuration/
│   └── AuthenticationExtensions.cs    # Dual auth scheme setup
├── Endpoints/
│   ├── DrAuthEndpoints.cs            # POST /api/dr/login
│   ├── SettingsEndpoints.cs          # GET /api/settings/status
│   ├── HealthEndpoints.cs            # Health checks
│   ├── WeatherPublicEndpoints.cs     # Public weather API
│   └── WeatherPrivateEndpoints.cs    # Protected weather API
├── Models/
│   ├── AuthPocSettings.cs            # Application settings
│   ├── DrUser.cs                     # DR user model
│   ├── DrLoginRequest.cs             # Login request DTO
│   ├── DrLoginResponse.cs            # Login response DTO
│   └── DrSettings.cs                 # DR JWT configuration
├── Services/
│   ├── DrUserStore.cs                # In-memory user store
│   └── DrTokenGenerator.cs           # JWT token generation
├── Program.cs                        # Application startup
└── appsettings.Development.json      # Configuration

AuthResilience.Poc.AppHost/
└── AppHost.cs                        # Aspire orchestration

frontend/
└── (React SPA - to be integrated)
```

---

## Next Steps

- [ ] Frontend: Implement authentication strategy detection
- [ ] Frontend: Add DR login form
- [ ] Frontend: Integrate MSAL for Entra ID
- [ ] Backend: Add audit logging
- [ ] Backend: Implement refresh tokens
- [ ] Backend: Add rate limiting

---
