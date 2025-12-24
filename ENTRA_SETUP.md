# Azure Entra ID Setup Guide

Complete step-by-step instructions for configuring Azure Entra ID to work with this POC.

## Prerequisites

- Azure subscription with Entra ID (Azure AD) tenant
- Global Administrator or Application Administrator role
- Access to Azure Portal: https://portal.azure.com

---

## Overview

You'll create:
1. **API App Registration** - Represents the backend ASP.NET Core API
2. **SPA App Registration** - Represents the React frontend
3. **App Roles** - Define `critical.operator` and `weather.tuner` roles
4. **API Permissions** - Allow SPA to call API
5. **User Assignments** - Assign roles to test users

---

## Part 1: Create API App Registration

### 1.1 Register the API Application

1. Navigate to **Azure Portal** → **Entra ID** (or **Azure Active Directory**)
2. Go to **App registrations** → **New registration**
3. Configure:
   - **Name:** `AuthResilience.Poc.Api` (or your preferred name)
   - **Supported account types:** Accounts in this organizational directory only (Single tenant)
   - **Redirect URI:** Leave empty (API doesn't need redirect)
4. Click **Register**

### 1.2 Configure Application ID URI

1. In your API app registration, go to **Expose an API**
2. Click **Add** next to Application ID URI
3. Accept the default: `api://<api-client-id>` or customize it
4. Click **Save**

**📝 Note this value** - You'll need it as `ENTRA_API_AUDIENCE`

### 1.3 Define App Roles

1. Still in your API app registration, go to **App roles**
2. Click **Create app role**

**Role 1: Critical Operator**
- **Display name:** `Critical Operator`
- **Allowed member types:** Users/Groups
- **Value:** `critical.operator`
- **Description:** `Can execute critical weather operations`
- **Enable this app role:** ✅ Checked
- Click **Apply**

**Role 2: Weather Tuner**
- **Display name:** `Weather Tuner`
- **Allowed member types:** Users/Groups
- **Value:** `weather.tuner`
- **Description:** `Can access advanced tuning parameters`
- **Enable this app role:** ✅ Checked
- Click **Apply**

### 1.4 Expose API Scope

1. Go to **Expose an API**
2. Click **Add a scope**
3. Configure:
   - **Scope name:** `access_as_user`
   - **Who can consent:** Admins and users
   - **Admin consent display name:** `Access AuthResilience API`
   - **Admin consent description:** `Allows the app to access AuthResilience API on behalf of the signed-in user`
   - **User consent display name:** `Access weather data`
   - **User consent description:** `Allows the app to access weather data on your behalf`
   - **State:** Enabled
4. Click **Add scope**

### 1.5 Collect API Configuration Values

From **Overview** page of API app registration:

```
Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID:   yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

**Save these values:**
- **Tenant ID** → Use for `entra-tenant-id` parameter
- **API Client ID** → Part of Application ID URI
- **Application ID URI** → Use for `entra-api-audience` parameter (e.g., `api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

## Part 2: Create SPA App Registration

### 2.1 Register the SPA Application

1. Go to **App registrations** → **New registration**
2. Configure:
   - **Name:** `AuthResilience.Poc.Frontend` (or your preferred name)
   - **Supported account types:** Accounts in this organizational directory only (Single tenant)
   - **Redirect URI:** 
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:3000` (or your frontend URL)
3. Click **Register**

### 2.2 Configure Additional Redirect URIs

1. In SPA app registration, go to **Authentication**
2. Under **Single-page application** section, add:
   - `http://localhost:3000`
   - `http://localhost:5173` (Vite default)
   - Any other dev URLs you use
3. **Logout URL:** `http://localhost:3000` (optional)
4. Under **Implicit grant and hybrid flows**: Leave unchecked (using Auth Code + PKCE)
5. Click **Save**

### 2.3 Grant API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **My APIs** tab
4. Find and select **AuthResilience.Poc.Api** (your API app)
5. Select **Delegated permissions**
6. Check **access_as_user**
7. Click **Add permissions**
8. Click **Grant admin consent for [Your Tenant]** (requires admin)
9. Confirm by clicking **Yes**

**Result:** You should see:
```
API / Permissions name          Type        Status
AuthResilience.Poc.Api
  access_as_user               Delegated   ✅ Granted for [Tenant]
```

### 2.4 Collect SPA Configuration Values

From **Overview** page of SPA app registration:

```
Application (client) ID: zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz
```

**Save this value:**
- **SPA Client ID** → Use for `entra-spa-client-id` parameter

---

## Part 3: Assign Roles to Users

### 3.1 Navigate to Enterprise Applications

1. Go to **Entra ID** → **Enterprise applications**
2. **Search** for `AuthResilience.Poc.Api` (your API app name)
3. Click on it

**Important:** Use Enterprise Applications, not App Registrations, for user assignments.

### 3.2 Assign Users to Roles

1. Go to **Users and groups**
2. Click **Add user/group**
3. Click **Users** → Select a user from your directory
4. Click **Select a role**
5. Choose either:
   - **Critical Operator** (for `critical.operator` role)
   - **Weather Tuner** (for `weather.tuner` role)
6. Click **Select**, then **Assign**

**Repeat for multiple users with different roles:**

**Example Assignments:**
- **User 1 (Admin):** Assign both `Critical Operator` AND `Weather Tuner` (assign twice)
- **User 2 (Operator):** Assign only `Critical Operator`
- **User 3 (Tuner):** Assign only `Weather Tuner`
- **User 4 (Reader):** Don't assign any role (authenticated but no special permissions)

### 3.3 Verify Assignments

1. In **Users and groups**, you should see:

```
User                    Role
john.doe@contoso.com    Critical Operator
john.doe@contoso.com    Weather Tuner
jane.smith@contoso.com  Critical Operator
bob.jones@contoso.com   Weather Tuner
```

**Note:** Users can have multiple role assignments. Check the backend will combine them into a single `roles` claim array.

---

## Part 4: Configure Application

### 4.1 Backend Configuration (Aspire)

When running `dotnet run` in `AuthResilience.Poc.AppHost`, provide:

```
entra-tenant-id:       yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
entra-spa-client-id:   zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz
entra-api-audience:    api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

These values are passed to both server and frontend via environment variables.

### 4.2 Frontend Environment Variables

If running frontend standalone (without Aspire):

**Create `.env.local` in `frontend/` folder:**

```bash
VITE_ENTRA_TENANT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
VITE_ENTRA_CLIENT_ID=zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz
VITE_API_AUDIENCE=api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 4.3 Backend Environment Variables

If running server standalone (without Aspire):

**Set in `launchSettings.json` or environment:**

```json
{
  "environmentVariables": {
    "ENTRA_TENANT_ID": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "ENTRA_API_AUDIENCE": "api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

---

## Part 5: Testing Entra ID Integration

### 5.1 Test Authentication Flow

1. Set `AuthMode = "normal"` in `appsettings.Development.json`
2. Run the application (via Aspire)
3. Navigate to frontend URL
4. Click **Sign In**
5. **Expected:** Redirect to Microsoft login page
6. Sign in with a user from your tenant
7. **Expected:** Consent screen (first time only) asking permission for app
8. Click **Accept**
9. **Expected:** Redirect back to app, authenticated

### 5.2 Verify Token Claims

**In browser console:**

```javascript
// Get MSAL instance
const accounts = msal.getAllAccounts();
console.log('ID Token Claims:', accounts[0].idTokenClaims);

// Check roles (should be in access token after first API call)
// See Network tab → any API request → Preview access token
```

**Expected claims in access token:**
```json
{
  "aud": "api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "iss": "https://login.microsoftonline.com/{tenant-id}/v2.0",
  "roles": [
    "critical.operator",
    "weather.tuner"
  ],
  "sub": "...",
  "name": "John Doe",
  ...
}
```

### 5.3 Test Authorization

**Test with user who has `critical.operator` role:**
1. Login
2. Navigate to weather page
3. **Expected:** "Recompute Weather Data" button is visible
4. Click button
5. **Expected:** API call succeeds (200 OK)

**Test with user who has NO roles:**
1. Login (user with no role assignments)
2. Navigate to weather page
3. **Expected:** "Recompute Weather Data" button is NOT visible
4. Manually call `/api/weather/private` (e.g., via Postman)
5. **Expected:** 403 Forbidden

---

## Troubleshooting

### Issue: "AADSTS50011: The reply URL specified in the request does not match..."

**Cause:** Redirect URI mismatch

**Solution:**
1. Check exact URL in browser (including port)
2. Go to SPA app registration → Authentication
3. Add exact URL to redirect URIs
4. Try again

### Issue: "AADSTS65001: The user or administrator has not consented..."

**Cause:** Admin consent not granted for API permissions

**Solution:**
1. Go to SPA app registration → API permissions
2. Click **Grant admin consent for [Tenant]**
3. Confirm

### Issue: Roles not appearing in token

**Cause 1:** User not assigned to role in Enterprise Application

**Solution:** Follow Part 3 to assign roles

**Cause 2:** Frontend reading from ID token instead of access token

**Solution:** Check `entraAuthStrategy.ts` - should decode **access token** in `getAccessToken()`, not read from `idTokenClaims`

### Issue: "AADSTS700016: Application with identifier 'api://...' was not found..."

**Cause:** Application ID URI not configured or mismatch

**Solution:**
1. Go to API app registration → Expose an API
2. Verify Application ID URI matches `ENTRA_API_AUDIENCE`
3. Update configuration if needed

### Issue: CORS errors when calling API

**Cause:** API not allowing frontend origin

**Solution:** Check `Program.cs` CORS configuration includes your frontend URL

### Issue: 401 Unauthorized on API calls

**Possible Causes:**
1. Token not being sent → Check `apiClient.ts` token interceptor
2. Wrong audience → Verify `ENTRA_API_AUDIENCE` matches Application ID URI
3. Token expired → MSAL should refresh automatically
4. Wrong authority → Verify `ENTRA_TENANT_ID` is correct

**Debug:**
1. Check Network tab → Request headers → `Authorization: Bearer ...`
2. Copy token, decode at https://jwt.ms
3. Verify `aud` claim matches expected audience
4. Verify `iss` claim matches tenant

---

## Token Anatomy

### Access Token (sent to API)

```json
{
  "aud": "api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "iss": "https://login.microsoftonline.com/{tenant}/v2.0",
  "iat": 1735045200,
  "exp": 1735048800,
  "roles": [
    "critical.operator",
    "weather.tuner"
  ],
  "sub": "user-object-id",
  "tid": "tenant-id",
  "name": "John Doe",
  "oid": "user-object-id",
  "scp": "access_as_user"
}
```

**Key Claims:**
- `aud` - Audience (must match API's expected value)
- `roles` - App roles assigned to user (used for authorization)
- `scp` - Scopes (delegated permissions)
- `iss` - Issuer (Entra ID authority)

### ID Token (for user info)

```json
{
  "aud": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
  "iss": "https://login.microsoftonline.com/{tenant}/v2.0",
  "name": "John Doe",
  "preferred_username": "john.doe@contoso.com",
  "oid": "user-object-id",
  "tid": "tenant-id"
}
```

**Note:** ID token typically does NOT contain `roles` - that's why frontend must decode the **access token**.

---

## Production Considerations

### Redirect URIs

Add production URLs:
- `https://your-app.azurewebsites.net`
- `https://your-custom-domain.com`

### Security

- Enable **Require assignment** in Enterprise Application (prevents unassigned users from authenticating)
- Use **Conditional Access policies** for additional security (MFA, IP restrictions, device compliance)
- Configure **Token lifetime policies** if defaults don't meet requirements
- Enable **Admin consent workflow** for production

### Multi-Environment Setup

Create separate app registrations for:
- Development (`AuthResilience.Poc.Api.Dev`)
- Staging (`AuthResilience.Poc.Api.Staging`)
- Production (`AuthResilience.Poc.Api.Prod`)

Each with their own redirect URIs and configuration.

### Monitoring

Enable **Sign-in logs** and **Audit logs** in Entra ID to monitor:
- Authentication failures
- Role assignments
- Consent grants
- Token issuance

---

## Quick Reference

### Configuration Values Summary

| Value | Where to Find | Used For |
|-------|--------------|----------|
| Tenant ID | API or SPA app → Overview | `entra-tenant-id`, authority URL |
| API Client ID | API app → Overview | Part of Application ID URI |
| SPA Client ID | SPA app → Overview | `entra-spa-client-id`, MSAL config |
| Application ID URI | API app → Expose an API | `entra-api-audience`, token audience |

### App Roles Summary

| Role Value | Display Name | Purpose |
|------------|--------------|---------|
| `critical.operator` | Critical Operator | Execute recompute operations |
| `weather.tuner` | Weather Tuner | Access advanced tuning parameters |

### Permission Summary

| API | Permission | Type | Required |
|-----|------------|------|----------|
| AuthResilience.Poc.Api | access_as_user | Delegated | Yes |

---

## Next Steps

After completing Entra ID setup:

1. ✅ Run the application in **Normal Mode** (`AuthMode = "normal"`)
2. ✅ Test authentication flow with multiple users
3. ✅ Verify role-based authorization works
4. ✅ Test **DR Mode** (`AuthMode = "dr"`) for fallback scenario
5. ✅ Compare behavior between modes

See [README.md](README.md) for running instructions and [FRONTEND.md](FRONTEND.md) for troubleshooting role extraction.
