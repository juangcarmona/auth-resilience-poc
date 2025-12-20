/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENTRA_TENANT_ID: string
  readonly VITE_ENTRA_CLIENT_ID: string
  readonly VITE_API_AUDIENCE: string
  readonly VITE_AUTH_MODE: 'normal' | 'dr'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
