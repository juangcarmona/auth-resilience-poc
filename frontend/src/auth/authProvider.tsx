import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { setTokenProvider } from '../services/apiClient';

const authMode = import.meta.env.VITE_AUTH_MODE;

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: string | null;
  roles: string[];
  isAuthorizedForCriticalOperation: boolean;
  login: () => void;
  logout: () => void;
  callCriticalOperation: () => Promise<string>;
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

function decodeToken(token: string): { roles?: string[]; name?: string; preferred_username?: string; aud?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  if (authMode === 'dr') {
    const drValue: AuthContextValue = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      roles: [],
      isAuthorizedForCriticalOperation: false,
      login: () => {},
      logout: () => {},
      callCriticalOperation: async () => {
        throw new Error('Authentication disabled in DR mode');
      },
    };

    return (
      <AuthContext.Provider value={drValue}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <h1>Disaster Recovery Mode</h1>
            <p>Federated authentication is disabled.</p>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  return <NormalModeAuthProvider>{children}</NormalModeAuthProvider>;
}

function NormalModeAuthProvider({ children }: { children: ReactNode }) {
  const [msalReactModule, setMsalReactModule] = useState<any>(null);
  const [msalInstance, setMsalInstance] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [inProgress, setInProgress] = useState<string>('startup');
  const [user, setUser] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function initMsal() {
      const [msalBrowser, msalReact, { getMsalInstance }] = await Promise.all([
        import('@azure/msal-browser'),
        import('@azure/msal-react'),
        import('./msalConfig')
      ]);

      setMsalReactModule(msalReact);

      const instance = await getMsalInstance();
      
      await instance.handleRedirectPromise();
      
      setMsalInstance(instance);
      setAccounts(instance.getAllAccounts());
      setInProgress('none');

      instance.addEventCallback((event: any) => {
        if (event.eventType === msalBrowser.EventType.LOGIN_SUCCESS ||
            event.eventType === msalBrowser.EventType.ACQUIRE_TOKEN_SUCCESS) {
          setAccounts(instance.getAllAccounts());
        }
      });

      setTokenProvider(async () => {
        const accts = instance.getAllAccounts();
        if (accts.length === 0) return null;
        try {
          const { tokenRequest: tokenReq } = await import('./msalConfig');
          const response = await instance.acquireTokenSilent({
            ...tokenReq,
            account: accts[0],
          });
          return response.accessToken;
        } catch {
          return null;
        }
      });
    }

    initMsal();
  }, []);

  useEffect(() => {
    if (!msalInstance || accounts.length === 0 || inProgress !== 'none') return;

    async function loadUserData() {
      try {
        const { tokenRequest: tokenReq } = await import('./msalConfig');
        const response = await msalInstance.acquireTokenSilent({
          ...tokenReq,
          account: accounts[0],
        });

        const decoded = decodeToken(response.accessToken);
        if (decoded) {
          setUser(decoded.name || decoded.preferred_username || 'Unknown');
          setRoles(decoded.roles || []);
          setIsAuthorized(decoded.roles?.includes('critical.operator') ?? false);
        }
      } catch (error) {
        console.error('Failed to acquire token:', error);
        setUser(null);
        setRoles([]);
        setIsAuthorized(false);
      }
    }

    loadUserData();
  }, [msalInstance, accounts, inProgress]);

  const login = () => {
    if (!msalInstance) return;
    import('./msalConfig').then(({ loginRequest }) => {
      msalInstance.loginRedirect(loginRequest);
    });
  };

  const logout = () => {
    if (!msalInstance) return;
    msalInstance.logoutRedirect();
  };

  const callCriticalOperation = async (): Promise<string> => {
    if (!isAuthorized) {
      throw new Error('Not authorized for critical operations');
    }

    if (!msalInstance || accounts.length === 0) {
      throw new Error('Not authenticated');
    }

    try {
      const { tokenRequest: tokenReq } = await import('./msalConfig');
      const response = await msalInstance.acquireTokenSilent({
        ...tokenReq,
        account: accounts[0],
      });

      const apiResponse = await fetch('/api/weather/operations/recompute', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const data = await apiResponse.text();
      return data || 'Operation completed successfully';
    } catch (error) {
      console.error('Critical operation failed:', error);
      throw error;
    }
  };

  const value: AuthContextValue = {
    isAuthenticated: accounts.length > 0,
    isLoading: inProgress !== 'none',
    user,
    roles,
    isAuthorizedForCriticalOperation: isAuthorized,
    login,
    logout,
    callCriticalOperation,
  };

  if (!msalReactModule || !msalInstance) {
    return (
      <AuthContext.Provider value={{ ...value, isLoading: true }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <p>Loading...</p>
        </div>
      </AuthContext.Provider>
    );
  }

  const MsalProvider = msalReactModule.MsalProvider;

  return (
    <MsalProvider instance={msalInstance}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </MsalProvider>
  );
}
