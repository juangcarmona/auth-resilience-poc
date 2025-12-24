import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/authProvider';
import { AppShell } from '../layout/AppShell';
import { DrLoginForm } from './DrLoginForm';

export function LoginPage() {
  const { isAuthenticated, isLoading, isDrMode, login, loginWithCredentials } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // DR Mode: Show custom login form
  if (isDrMode && loginWithCredentials) {
    return <DrLoginForm onLogin={loginWithCredentials} />;
  }

  // Normal Mode: Show MSAL login (AppShell has the login button)
  return <AppShell><div /></AppShell>;
}
