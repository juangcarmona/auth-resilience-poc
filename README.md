# Auth Resilience POC (Aspire + Entra ID)

This repository contains a **.NET Aspire demo** that shows how to run a **React SPA + ASP.NET Core API** using **your own Azure Entra ID tenant** for authentication and **role-based authorization**, with the groundwork in place for a **fallback authentication mechanism**.

The focus is **identity wiring and resilience**, not UI polish.

---

## What this demo shows

* Real Azure Entra ID integration (no mocks)
* SPA authentication using **MSAL (Authorization Code Flow + PKCE)**
* API authentication using **JWT Bearer**
* **App role–based authorization** for critical operations
* Centralized configuration and feature flags via **Aspire AppHost**
* A feature-flagged path for a future **authentication fallback mode**

---

## Entra ID requirements

You need an Entra ID tenant with:

### App registrations

* **SPA application**
* **API application**

### API configuration

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

### User assignment

* Assign the `critical.operator` role to users who need to execute critical operations
* Optionally assign the `weather.tuner` role to power users who need fine-grained control over recompute parameters

---

## Running locally

1. Clone the repo
2. Run the Aspire AppHost:

   ```bash
   dotnet run
   ```
3. Provide the required parameters when prompted:

   * `entra-tenant-id`
   * `entra-spa-client-id`
   * `entra-api-audience`

Aspire will start:

* The API
* The React frontend
* All required wiring

### Role-based features

**All authenticated users** can view weather forecasts.

**Users with `critical.operator` role** can execute the "Recompute Weather Data" operation with default parameters.

**Users with both `critical.operator` and `weather.tuner` roles** can:
* Execute recompute with default parameters (standard behavior)
* Access an "Advanced Options" panel to customize:
  * **Days**: Number of days to recompute (1-30)
  * **Resolution**: Data resolution level (low/medium/high)
  * **Model**: Computation model (standard/experimental)

The advanced options panel is only visible to users with the `weather.tuner` role, demonstrating fine-grained role-based UI capabilities.

---

## About the fallback mechanism

The solution includes **feature flags and configuration hooks** to support an alternative authentication mode when Entra ID is unavailable.

The fallback flow is **not implemented yet** — this repo establishes the baseline required to add it safely.

---
