/**
 * Authentication strategy interface.
 * Both Entra and DR auth providers must implement this contract.
 */
export interface AuthStrategy {
  /**
   * Initialize the auth strategy (e.g., handle redirects, restore session).
   */
  initialize(): Promise<void>;

  /**
   * Check if user is currently authenticated.
   */
  isAuthenticated(): boolean;

  /**
   * Check if initialization is in progress.
   */
  isLoading(): boolean;

  /**
   * Get current user display name.
   */
  getUser(): string | null;

  /**
   * Get user's roles.
   */
  getRoles(): string[];

  /**
   * Initiate login flow.
   */
  login(): Promise<void>;

  /**
   * Perform logout.
   */
  logout(): Promise<void>;

  /**
   * Get access token for API calls.
   */
  getAccessToken(): Promise<string | null>;

  /**
   * Subscribe to auth state changes.
   * Returns an unsubscribe function.
   */
  onAuthStateChanged(callback: () => void): () => void;
}

/**
 * Application settings returned from /api/settings/status
 */
export interface AppSettings {
  authMode: string;
  isDrMode: boolean;
  drMaxTtlMinutes: number;
  environment: string;
  maintenanceMode: boolean;
  apiVersion: string;
  timestamp: string;
}
