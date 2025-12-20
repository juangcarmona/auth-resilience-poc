import type { ReactNode } from 'react';
import { useAuth } from '../auth/authProvider';
import { TopNav } from './TopNav';
import './AppShell.css';

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const { isAuthenticated, isLoading, login } = useAuth();

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <h1>Weather Operations</h1>
                    <h3>Authentication Required</h3>
                    <p>Please sign in to access the application.</p>
                    <button onClick={login} className="btn btn-primary">
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <TopNav />
            <main className="app-main">{children}</main>
        </div>
    );
}
