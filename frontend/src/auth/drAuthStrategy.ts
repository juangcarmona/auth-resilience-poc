import type { AuthStrategy } from './authStrategy';

const TOKEN_KEY = 'dr_access_token';
const USER_KEY = 'dr_user_data';

interface DrUserData {
  username: string;
  name: string;
  roles: string[];
  expiresAt: number;
}

interface DrLoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  name: string;
  roles: string[];
}

/**
 * Disaster Recovery authentication strategy using custom login.
 */
export class DrAuthStrategy implements AuthStrategy {
  private loading = false;
  private authenticated = false;
  private userData: DrUserData | null = null;
  private listeners: Set<() => void> = new Set();

  async initialize(): Promise<void> {
    this.loading = true;
    
    // Try to restore session from localStorage
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUserData = localStorage.getItem(USER_KEY);

    if (storedToken && storedUserData) {
      try {
        const userData: DrUserData = JSON.parse(storedUserData);
        
        // Check if token is expired
        if (Date.now() < userData.expiresAt) {
          this.authenticated = true;
          this.userData = userData;
        } else {
          // Token expired, clear storage
          this.clearSession();
        }
      } catch {
        this.clearSession();
      }
    }

    this.loading = false;
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  isLoading(): boolean {
    return this.loading;
  }

  getUser(): string | null {
    return this.userData?.name || null;
  }

  getRoles(): string[] {
    return this.userData?.roles || [];
  }

  async login(): Promise<void> {
    // Login is handled by DrLoginForm submitting credentials
    // This method is a no-op for DR mode
  }

  async loginWithCredentials(username: string, password: string): Promise<void> {
    const response = await fetch('/api/dr/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }

    const data: DrLoginResponse = await response.json();

    // Calculate expiration timestamp
    const expiresAt = Date.now() + (data.expiresIn * 1000);

    this.userData = {
      username: data.username,
      name: data.name,
      roles: data.roles,
      expiresAt,
    };

    // Store token and user data
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(this.userData));

    this.authenticated = true;
    this.notifyListeners();
  }

  async logout(): Promise<void> {
    this.clearSession();
    this.notifyListeners();
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.authenticated) return null;

    const token = localStorage.getItem(TOKEN_KEY);
    
    // Check expiration
    if (this.userData && Date.now() >= this.userData.expiresAt) {
      // Token expired
      await this.logout();
      return null;
    }

    return token;
  }

  onAuthStateChanged(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.authenticated = false;
    this.userData = null;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}
