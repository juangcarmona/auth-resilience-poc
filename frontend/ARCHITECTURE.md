# Frontend Architecture

## Structure

```
src/
├── auth/                    # Authentication logic
│   ├── authProvider.tsx     # Auth context provider with MSAL integration
│   ├── AuthenticatedRoute.tsx # Route guard for protected pages
│   └── msalConfig.ts        # MSAL singleton configuration
│
├── layout/                  # Shell components
│   ├── AppShell.tsx         # Main application shell
│   ├── AppShell.css
│   ├── TopNav.tsx          # Sticky top navigation with user menu
│   └── TopNav.css
│
├── routes/                  # Page components
│   ├── WeatherPage.tsx     # Weather forecast view with critical operations
│   ├── WeatherPage.css
│   ├── UserDetailsPage.tsx # User profile/details view
│   └── UserDetailsPage.css
│
├── services/                # API layer
│   ├── apiClient.ts        # HTTP client with token interceptor
│   └── weatherService.ts   # Weather API endpoints
│
├── App.tsx                 # Root router configuration
└── main.tsx                # Application entry point
```

## Key Features

### 1. Application Shell
- **AppShell**: Wraps all authenticated content
- **TopNav**: Sticky navigation bar with:
  - Application title (clickable to home)
  - User menu button showing:
    - User display name
    - Assigned roles
    - Link to user details page
    - Sign out action

### 2. Routing
- React Router for client-side navigation
- **AuthenticatedRoute** guard blocks unauthenticated access
- Routes:
  - `/` - Weather forecast page (protected)
  - `/profile` - User details page (protected)
  - `/login` - Login redirect placeholder

### 3. HTTP Interceptor
- **apiClient**: Centralized HTTP client
- **setTokenProvider**: Configures token acquisition
- Automatically attaches Bearer token to all API requests
- Simplifies service layer code

### 4. Weather Feature
- Fetches weather data from `/api/weather/public`
- Displays forecast in card grid
- Temperature unit toggle (°C / °F)
- **Critical Operations** section (only for authorized users):
  - "Recompute Weather Data" button
  - Calls `/api/weather/operations/recompute` with token
  - Requires `critical.operator` role
- **Advanced Options** (only for users with `weather.tuner` role):
  - Collapsible panel with fine-grained parameters:
    - **Days**: Number of days to recompute (1-30)
    - **Resolution**: Data resolution (low/medium/high)
    - **Model**: Computation model (standard/experimental)
  - Parameters sent only when advanced panel is expanded
  - Demonstrates role-based progressive disclosure

### 5. Authorization
- Client-side role checking via `isAuthorizedForCriticalOperation`
- Role-based UI features via `hasRole()` helper
- Multi-tier authorization:
  - Base access: Authenticated users can view weather
  - Critical operations: `critical.operator` role required
  - Advanced controls: `weather.tuner` role required
- UI elements hidden/disabled based on authorization
- No 403 responses used for control flow

## Auth Flow

1. App loads → AuthProvider initializes MSAL
2. MSAL handles redirect promise on startup
3. Token provider configured for HTTP client
4. User data loaded from access token
5. Routes protected by AuthenticatedRoute guard
6. API calls automatically include Bearer token

## Environment Variables

Same as before:
- `VITE_ENTRA_TENANT_ID`
- `VITE_ENTRA_CLIENT_ID`
- `VITE_API_AUDIENCE`
- `VITE_AUTH_MODE` (normal | dr)

## Future Extensions

This architecture supports:
- Additional pages/routes
- More API services
- Custom HTTP interceptors
- DR mode implementation
- Advanced auth flows
