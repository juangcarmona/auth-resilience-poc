import type { AuthStrategy } from './authStrategy';

/**
 * Entra ID (Azure AD) authentication strategy using MSAL.
 */
export class EntraAuthStrategy implements AuthStrategy {
    private msalInstance: any = null;
    private loading = true;
    private accounts: any[] = [];
    private listeners: Set<() => void> = new Set();
    private roles: string[] = [];

    async initialize(): Promise<void> {
        const [msalBrowser, { getMsalInstance }] = await Promise.all([
            import('@azure/msal-browser'),
            import('./msalConfig')
        ]);

        this.msalInstance = await getMsalInstance();

        // Handle redirect promise
        await this.msalInstance.handleRedirectPromise();

        this.accounts = this.msalInstance.getAllAccounts();
        this.loading = false;

        // Listen for auth events
        this.msalInstance.addEventCallback((event: any) => {
            if (event.eventType === msalBrowser.EventType.LOGIN_SUCCESS ||
                event.eventType === msalBrowser.EventType.ACQUIRE_TOKEN_SUCCESS ||
                event.eventType === msalBrowser.EventType.LOGOUT_SUCCESS) {
                this.accounts = this.msalInstance.getAllAccounts();
                this.notifyListeners();
            }
        });
    }

    isAuthenticated(): boolean {
        return this.accounts.length > 0;
    }

    isLoading(): boolean {
        return this.loading;
    }

    getUser(): string | null {
        if (this.accounts.length === 0) return null;
        return this.accounts[0].name || this.accounts[0].username || null;
    }

    getRoles(): string[] {
        return this.roles;
    }

    async login(): Promise<void> {
        const { loginRequest } = await import('./msalConfig');
        await this.msalInstance.loginRedirect(loginRequest);
    }

    async logout(): Promise<void> {
        await this.msalInstance.logoutRedirect({
            postLogoutRedirectUri: window.location.origin,
        });
    }
    
    async getAccessToken(): Promise<string | null> {
        if (this.accounts.length === 0) return null;

        try {
            const { tokenRequest } = await import('./msalConfig');
            const response = await this.msalInstance.acquireTokenSilent({
                ...tokenRequest,
                account: this.accounts[0],
            });

            // 🔑 Decode access token claims
            const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
            this.roles = payload.roles ?? [];

            this.notifyListeners();
            return response.accessToken;
        } catch (error) {
            console.error('Failed to acquire token silently:', error);
            return null;
        }
    }

    onAuthStateChanged(callback: () => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }
}
