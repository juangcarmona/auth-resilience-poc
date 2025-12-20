import { useState } from 'react';
import { useAuth } from './auth/authProvider';
import './App.css';

function App() {
  const {
    isAuthenticated,
    isLoading,
    user,
    roles,
    isAuthorizedForCriticalOperation,
    login,
    logout,
    callCriticalOperation,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecompute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await callCriticalOperation();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute operation');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="card">
          <h1>Authentication Required</h1>
          <button onClick={login} className="btn btn-primary">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Critical Operations</h1>
        
        <div className="user-info">
          <p><strong>User:</strong> {user || 'Unknown'}</p>
          <p><strong>Roles:</strong> {roles.length > 0 ? roles.join(', ') : 'None'}</p>
          <p className={isAuthorizedForCriticalOperation ? 'status-authorized' : 'status-unauthorized'}>
            <strong>Authorization Status:</strong>{' '}
            {isAuthorizedForCriticalOperation 
              ? 'Authorized for critical operations' 
              : 'Not authorized for critical operations'}
          </p>
        </div>

        <div className="actions">
          <button
            onClick={handleRecompute}
            disabled={!isAuthorizedForCriticalOperation || loading}
            className="btn btn-primary"
          >
            {loading ? 'Processing...' : 'Recompute Weather Data'}
          </button>
          <button onClick={logout} className="btn btn-secondary">
            Sign Out
          </button>
        </div>

        {result && (
          <div className="result success">
            <strong>Success:</strong> {result}
          </div>
        )}

        {error && (
          <div className="result error">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
