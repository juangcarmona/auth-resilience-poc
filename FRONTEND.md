# Frontend Implementation

React SPA with TypeScript, strategy pattern authentication.

## Architecture

### Strategy Pattern

**Core concept:** Authentication mode is infrastructure, not business logic.

**Interface:** [src/auth/authStrategy.ts](frontend/src/auth/authStrategy.ts)

Defines contract for all auth implementations:
- `initialize()` - Setup and session restore
- `isAuthenticated()` / `isLoading()` - State queries
- `getUser()` / `getRoles()` - User info
- `login()` / `logout()` - Auth actions
- `getAccessToken()` - Token for API calls
- `onAuthStateChanged()` - State subscription

### Implementations

#### Entra Strategy

**File:** [src/auth/entraAuthStrategy.ts](frontend/src/auth/entraAuthStrategy.ts)

Uses MSAL for Azure Entra ID OAuth 2.0 + OIDC flow:
- Manages `PublicClientApplication` singleton
- Handles redirect promise on initialize
- Acquires tokens silently with fallback to interactive
- **Key fix:** Extracts roles from **access token**, not ID token
- Caches roles after token acquisition

**MSAL Config:** [src/auth/msalConfig.ts](frontend/src/auth/msalConfig.ts)

#### DR Strategy

**File:** [src/auth/drAuthStrategy.ts](frontend/src/auth/drAuthStrategy.ts)

Custom username/password authentication:
- `loginWithCredentials()` POSTs to `/api/dr/login`
- Stores JWT + user data in localStorage
- Manages token expiration checking
- Clears session on logout or expiry

**Storage Keys:**
- `dr_access_token` - JWT string
- `dr_user_data` - JSON with username, name, roles, expiresAt

### Auth Provider

**File:** [src/auth/authProvider.tsx](frontend/src/auth/authProvider.tsx)

**Bootstrap Flow:**
1. Fetch `/api/settings/status`
2. Instantiate appropriate strategy based on `isDrMode`
3. Initialize strategy (restore session, handle redirects)
4. Configure API client with `setTokenProvider()`
5. Subscribe to auth state changes
6. Render app

**Context API:**
```typescript
const {
  isAuthenticated,
  isLoading,
  user,
  roles,
  isAuthorizedForCriticalOperation,
  isDrMode,
  login,
  loginWithCredentials,  // DR only
  logout,
  hasRole
} = useAuth();
```

**Business logic consumes this context without knowing active strategy.**

## Components

### Login Page

**File:** [src/routes/LoginPage.tsx](frontend/src/routes/LoginPage.tsx)

Adapts based on auth mode:
- **Normal Mode:** Shows `AppShell` with "Sign In" button (triggers MSAL redirect)
- **DR Mode:** Shows `DrLoginForm` component

### DR Login Form

**Files:** [src/routes/DrLoginForm.tsx](frontend/src/routes/DrLoginForm.tsx), [DrLoginForm.css](frontend/src/routes/DrLoginForm.css)

Username/password form with:
- Red pulsing "DISASTER RECOVERY MODE" badge
- Input validation
- Error handling
- Hints for test users
- POC disclaimer

### Top Navigation

**Files:** [src/layout/TopNav.tsx](frontend/src/layout/TopNav.tsx), [TopNav.css](frontend/src/layout/TopNav.css)

Sticky navigation bar with:
- App title (clickable → home)
- **DR mode indicator** - Red pulsing badge when `isDrMode === true`
- User menu showing:
  - Display name
  - Assigned roles
  - Link to profile page
  - Sign out button

### App Shell

**Files:** [src/layout/AppShell.tsx](frontend/src/layout/AppShell.tsx)

Main layout wrapper for authenticated content:
- TopNav component
- Main content area
- Handles routing

### Weather Page

**Files:** [src/routes/WeatherPage.tsx](frontend/src/routes/WeatherPage.tsx)

Demonstrates role-based UI:
- Weather forecast cards (all users)
- Temperature unit toggle (°C/°F)
- **Critical Operations** section:
  - "Recompute Weather Data" button
  - Visible only if `isAuthorizedForCriticalOperation === true`
  - Requires `critical.operator` role
- **Advanced Options** panel:
  - Collapsible parameter controls (days, resolution, model)
  - Visible only if `hasRole('weather.tuner') === true`
  - Demonstrates progressive disclosure

### Authenticated Route

**File:** [src/auth/AuthenticatedRoute.tsx](frontend/src/auth/AuthenticatedRoute.tsx)

Route guard:
- Shows loading spinner while initializing
- Redirects to login if not authenticated
- Renders protected component when authenticated

## Services

### API Client

**File:** [src/services/apiClient.ts](frontend/src/services/apiClient.ts)

Centralized HTTP client with token interceptor:
- `setTokenProvider()` - Configured during bootstrap with strategy's `getAccessToken`
- Automatically attaches `Authorization: Bearer <token>` header
- Token source transparent to service layer

### Weather Service

**File:** [src/services/weatherService.ts](frontend/src/services/weatherService.ts)

API endpoints:
- `getWeatherForecast()` - Public weather data
- `getPrivateWeatherData()` - Protected data
- `recomputeWeatherData()` - Critical operation with optional params

Uses `apiClient` - no auth logic in service layer.

## Authentication Flows

### Normal Mode (Entra)

```
App Start
  ↓
Fetch /api/settings/status → isDrMode: false
  ↓
Create EntraAuthStrategy
  ↓
Initialize MSAL → handle redirect promise
  ↓
Set token provider → strategy.getAccessToken
  ↓
Render login page (Sign In button)

User clicks "Sign In"
  ↓
MSAL redirect to Azure Entra ID
  ↓
User authenticates
  ↓
Redirect back with tokens
  ↓
MSAL stores tokens
  ↓
Acquire token silently → decode roles from access token
  ↓
Context updates → isAuthenticated: true
  ↓
Protected routes accessible
```

### DR Mode

```
App Start
  ↓
Fetch /api/settings/status → isDrMode: true
  ↓
Create DrAuthStrategy
  ↓
Initialize → restore session from localStorage
  ↓
Set token provider → () => localStorage.getItem('dr_access_token')
  ↓
Render login page (DrLoginForm)

User enters credentials
  ↓
POST /api/dr/login
  ↓
Receive JWT + user data
  ↓
Store in localStorage
  ↓
Context updates → isAuthenticated: true
  ↓
Protected routes accessible
```

## Role-Based Authorization

**Pattern:** Conditional rendering based on auth context.

**Examples:**

Check specific role:
```typescript
{hasRole('weather.tuner') && (
  <AdvancedOptionsPanel />
)}
```

Check derived permission:
```typescript
{isAuthorizedForCriticalOperation && (
  <Button onClick={handleRecompute}>
    Recompute Weather Data
  </Button>
)}
```

**No mode-specific checks in business logic** - works identically for Entra and DR.

## Environment Variables

**Required for Entra mode:**
- `VITE_ENTRA_TENANT_ID` - Azure tenant ID
- `VITE_ENTRA_CLIENT_ID` - SPA application client ID  
- `VITE_API_AUDIENCE` - API scope/audience

**Removed:**
- ~~`VITE_AUTH_MODE`~~ - Now determined dynamically

## Key Implementation Details

### Role Extraction Fix

**Issue:** Entra ID includes roles in **access token**, not ID token.

**Solution:** In `entraAuthStrategy.ts`, `getAccessToken()` method:
1. Acquires token silently
2. Decodes access token JWT payload
3. Extracts `roles` array
4. Caches in strategy instance
5. Notifies listeners

**Code reference:** See `getAccessToken()` in [entraAuthStrategy.ts](frontend/src/auth/entraAuthStrategy.ts)

### Bootstrap Detection

**Critical pattern:** Frontend doesn't hardcode auth mode.

On app start:
1. Fetch `/api/settings/status` (no auth required)
2. Read `isDrMode` from response
3. Instantiate appropriate strategy
4. Initialize strategy
5. Configure token provider
6. Subscribe to state changes

**Code reference:** See `useEffect` in [authProvider.tsx](frontend/src/auth/authProvider.tsx)

### Token Provider Pattern

**Decouples API client from auth strategy:**

```typescript
// During bootstrap
setTokenProvider(() => strategy.getAccessToken());

// In API client
const token = await tokenProvider();
if (token) {
  headers.Authorization = `Bearer ${token}`;
}
```

API client doesn't know which strategy is active.

## Testing

### Normal Mode

1. Backend: Set `AuthMode = "normal"`
2. Start app
3. See "Sign In" button
4. Click → MSAL redirect to Azure
5. Authenticate with Entra credentials
6. Return to app → authenticated
7. Check roles in user menu

### DR Mode

1. Backend: Set `AuthMode = "dr"`
2. Start app
3. See username/password form
4. Enter `admin / Admin123!`
5. Submit → authenticated
6. Red "DISASTER RECOVERY MODE" badge visible
7. Check roles in user menu

### Role-Based Features

Test with different users:
- **admin** - See both recompute button and advanced options
- **operator** - See only recompute button
- **tuner** - See only advanced options (if implemented)

## Project Structure

```
frontend/src/
├── auth/                          # Authentication
│   ├── authStrategy.ts            # Interface definition
│   ├── entraAuthStrategy.ts       # MSAL implementation
│   ├── drAuthStrategy.ts          # Custom login
│   ├── authProvider.tsx           # Context provider
│   ├── AuthenticatedRoute.tsx     # Route guard
│   └── msalConfig.ts              # MSAL singleton
│
├── layout/                        # Shell components
│   ├── AppShell.tsx               # Main layout
│   ├── TopNav.tsx                 # Navigation bar
│   └── *.css                      # Styles
│
├── routes/                        # Pages
│   ├── LoginPage.tsx              # Login routing
│   ├── DrLoginForm.tsx            # DR form
│   ├── WeatherPage.tsx            # Main feature
│   ├── UserDetailsPage.tsx        # Profile
│   └── *.css                      # Styles
│
├── services/                      # API layer
│   ├── apiClient.ts               # HTTP client
│   └── weatherService.ts          # Weather endpoints
│
├── App.tsx                        # Router config
└── main.tsx                       # Entry point
```

## Design Principles

1. **Strategy Pattern** - Auth mode is pluggable implementation
2. **Single Source of Truth** - Backend controls mode via settings endpoint
3. **Unified Interface** - Business logic uses `useAuth()` hook
4. **No Branching** - Token handling works identically across modes
5. **Clean Separation** - Auth isolated from business logic
6. **Type Safety** - Full TypeScript coverage

## Future Extensions

This architecture supports:
- Additional strategies (SAML, certificate-based, etc.)
- Token refresh logic
- Multi-factor authentication
- Session management
- Graceful degradation (auto-switch on Entra failure)

## Common Issues

### Roles Not Appearing (Entra Mode)

**Symptom:** `roles` array is empty after Entra login  
**Cause:** Roles are in access token, not ID token  
**Solution:** Decode access token in `getAccessToken()`, not ID token in `getRoles()`

**Fix location:** [entraAuthStrategy.ts](frontend/src/auth/entraAuthStrategy.ts) - See lines 66-86

### MSAL Redirect Loop

**Symptom:** Endless redirects to Entra  
**Cause:** `handleRedirectPromise()` not called during initialize  
**Solution:** Ensure `await msalInstance.handleRedirectPromise()` in `EntraAuthStrategy.initialize()`

### DR Mode Not Detected

**Symptom:** Always shows MSAL login even when backend in DR mode  
**Cause:** `/api/settings/status` call failing or not awaited  
**Solution:** Check network tab, ensure endpoint returns before rendering
