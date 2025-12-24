# Auth Resilience POC

> **Dual authentication mode demonstration**: Azure Entra ID with Disaster Recovery fallback

This proof-of-concept demonstrates a **resilient authentication architecture** for enterprise applications that need to continue operating when primary identity providers are unavailable. Built with **.NET Aspire**, **ASP.NET Core**, and **React**, it showcases production-grade patterns for authentication failover.

## Overview

**Primary Authentication:** Azure Entra ID (OAuth 2.0 + OpenID Connect)  
**Fallback Authentication:** Local JWT with symmetric signing (DR mode)  
**Architecture:** Dual JWT Bearer schemes with dynamic strategy selection  
**Authorization:** Unified role-based access control across both modes

## Key Capabilities

✅ Real Azure Entra ID integration with MSAL  
✅ Dual authentication schemes running simultaneously  
✅ Dynamic mode detection via settings endpoint  
✅ Frontend strategy pattern for transparent auth handling  
✅ Role-based authorization working identically in both modes  
✅ Settings-based configuration (simulates database storage)  
✅ .NET Aspire orchestration with centralized configuration

## Architecture

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Orchestration | .NET Aspire (AppHost) |
| Backend API | ASP.NET Core Minimal APIs (.NET 10) |
| Frontend | React 18 + TypeScript + Vite |
| Primary Auth | Azure Entra ID (OAuth 2.0 + OIDC) |
| DR Auth | Custom JWT Bearer (HMAC-SHA256) |
| Frontend Auth | MSAL Browser + Strategy Pattern |

### Authentication Flow

**Normal Mode (Entra ID):**
1. Frontend calls `/api/settings/status` → detects `isDrMode: false`
2. Instantiates `EntraAuthStrategy` with MSAL
3. User clicks "Sign In" → MSAL redirect to Azure
4. User authenticates → returns with ID + access tokens
5. Frontend extracts roles from **access token** (not ID token)
6. API validates JWT against Entra's public keys

**DR Mode (Fallback):**
1. Frontend calls `/api/settings/status` → detects `isDrMode: true`
2. Instantiates `DrAuthStrategy` with custom login
3. Shows username/password form
4. User submits → `POST /api/dr/login` with credentials
5. Backend validates against in-memory store → returns JWT
6. Frontend stores token → API validates with symmetric key

### Dual JWT Bearer Scheme Design

See [SERVER.md](SERVER.md) for backend implementation details.

Both schemes (`EntraBearer` and `DrBearer`) run simultaneously. The default scheme is selected at startup via `AuthPocSettings.AuthMode` configuration. Authorization policies work identically across both schemes because role claims are mapped consistently.

## Configuration

**Mode Selection:** Edit `appsettings.Development.json`:
```json
{
  "AuthPocSettings": {
    "AuthMode": "normal"  // or "dr" for disaster recovery
  }
}
```

**DR Test Users:** admin/Admin123!, operator/Operator123!, tuner/Tuner123!

See [SERVER.md](SERVER.md) for complete configuration details and security considerations.

## API Endpoints

**Public:**
- `GET /api/settings/status` - Returns current auth mode (used by frontend for strategy selection)
- `POST /api/dr/login` - DR authentication (only when `AuthMode=dr`)
- `GET /api/weather` - Public weather data

**Protected (requires authentication):**
- `GET /api/weather/private` - Requires `critical.operator` role
- `GET /api/health` - Health check

See [SERVER.md](SERVER.md) for endpoint details and request/response schemas.

## Entra ID Setup

Requires Azure tenant with:
- **SPA App Registration** for React frontend
- **API App Registration** with:
  - Application ID URI: `api://<api-client-id>`
  - App roles: `critical.operator`, `weather.tuner`
  - Delegated scope: `access_as_user`
- **User role assignments** via Enterprise Applications

See [FRONTEND.md](FRONTEND.md) for MSAL configuration details.

## Quick Start

**1. Configure auth mode:**  
Edit `AuthResilience.Poc.Server/appsettings.Development.json` → Set `AuthMode` to `"normal"` or `"dr"`

**2. Run Aspire:**  
```bash
cd AuthResilience.Poc.AppHost
dotnet run
```

**3. Provide Entra credentials:**  
When prompted: `entra-tenant-id`, `entra-spa-client-id`, `entra-api-audience`

**4. Access:**  
Aspire Dashboard → See API and Frontend URLs in console

### Testing Both Modes

**Normal Mode:** Sign in with Azure Entra ID credentials  
**DR Mode:** Login with `admin / Admin123!` (or operator, tuner)

## How It Works

**Frontend Bootstrap:**  
Calls `/api/settings/status` → Instantiates appropriate strategy (`EntraAuthStrategy` or `DrAuthStrategy`) → Business logic uses unified `useAuth()` hook

See [FRONTEND.md](FRONTEND.md) for strategy pattern implementation details.

## Role-Based Authorization

**Roles:**
- `critical.operator` - Execute "Recompute Weather Data" operation
- `weather.tuner` - Access advanced options (days, resolution, model)

**Demo Feature:**  
Weather page shows role-gated UI elements. Advanced options panel visible only to users with both roles.

Authorization works identically in both Entra and DR modes.

## Project Structure

```
AuthResilience.Poc.Server/     # ASP.NET Core API
├── Configuration/             # Auth extensions
├── Endpoints/                 # Minimal API endpoints
├── Models/                    # Settings & DTOs
└── Services/                  # DR auth services

AuthResilience.Poc.AppHost/    # .NET Aspire orchestration

frontend/                      # React SPA
├── src/auth/                  # Strategy pattern auth
├── src/routes/                # Pages (weather, login)
├── src/services/              # API client
└── src/layout/                # Shell components
```

See [SERVER.md](SERVER.md) and [FRONTEND.md](FRONTEND.md) for detailed structure.

## Security Warning

⚠️ **DR Mode is POC-only**: Plain text passwords, in-memory storage, symmetric keys in config.

**Production Considerations:**
- Certificate-based authentication
- Password hashing (bcrypt/Argon2)
- Encrypted database storage
- Azure Key Vault for secrets
- Rate limiting & account lockout
- Audit logging
- MFA/2FA support
- Refresh token rotation

See [SERVER.md](SERVER.md) for detailed security recommendations.

## Documentation

- **[SERVER.md](SERVER.md)** - Backend implementation, endpoints, configuration
- **[FRONTEND.md](FRONTEND.md)** - React architecture, strategy pattern, MSAL setup

---

**Focus:** Authentication resilience patterns, not production-ready security.
