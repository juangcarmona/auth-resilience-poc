import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { setTokenProvider } from '../services/apiClient';
import type { AuthStrategy, AppSettings } from './authStrategy';
import { EntraAuthStrategy } from './entraAuthStrategy';
import { DrAuthStrategy } from './drAuthStrategy';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: string | null;
  roles: string[];
  isAuthorizedForCriticalOperation: boolean;
  isDrMode: boolean;
  login: () => void;
  loginWithCredentials?: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [strategy, setStrategy] = useState<AuthStrategy | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [initError, setInitError] = useState<string | null>(null);

  // Bootstrap: Fetch settings and initialize strategy
  useEffect(() => {
    async function bootstrap() {
      try {
        // Fetch app settings to determine auth mode
        const response = await fetch('/api/settings/status');
        if (!response.ok) {
          throw new Error('Failed to fetch application settings');
        }
        
        const settings: AppSettings = await response.json();
        setAppSettings(settings);

        // Create appropriate strategy
        const authStrategy = settings.isDrMode
          ? new DrAuthStrategy()
          : new EntraAuthStrategy();

        // Initialize strategy
        await authStrategy.initialize();
        setStrategy(authStrategy);

        // Configure token provider for API client
        setTokenProvider(() => authStrategy.getAccessToken());

        // Subscribe to auth state changes
        authStrategy.onAuthStateChanged(() => {
          updateAuthState(authStrategy);
        });

        // Set initial state
        updateAuthState(authStrategy);
        setIsLoading(false);
      } catch (error) {
        console.error('Bootstrap error:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize');
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  function updateAuthState(authStrategy: AuthStrategy) {
    setIsAuthenticated(authStrategy.isAuthenticated());
    setUser(authStrategy.getUser());
    setRoles(authStrategy.getRoles());
  }

  function hasRole(role: string): boolean {
    return roles.includes(role);
  }

  const isAuthorizedForCriticalOperation = hasRole('critical.operator');
  const isDrMode = appSettings?.isDrMode || false;

  async function handleLogin() {
    if (!strategy) return;
    await strategy.login();
  }

  async function handleLoginWithCredentials(username: string, password: string) {
    if (!strategy || !(strategy instanceof DrAuthStrategy)) {
      throw new Error('DR login not available');
    }
    await strategy.loginWithCredentials(username, password);
  }

  async function handleLogout() {
    if (!strategy) return;
    await strategy.logout();
  }

  // Show loading state during bootstrap
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Initializing...
      </div>
    );
  }

  // Show error state if bootstrap failed
  if (initError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#c33' }}>Initialization Error</h1>
        <p>{initError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const contextValue: AuthContextValue = {
    isAuthenticated,
    isLoading: strategy?.isLoading() || false,
    user,
    roles,
    isAuthorizedForCriticalOperation,
    isDrMode,
    login: handleLogin,
    loginWithCredentials: isDrMode ? handleLoginWithCredentials : undefined,
    logout: handleLogout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
