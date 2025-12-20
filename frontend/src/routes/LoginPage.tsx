import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/authProvider';
import { AppShell } from '../layout/AppShell';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

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

  return <AppShell><div /></AppShell>;
}
