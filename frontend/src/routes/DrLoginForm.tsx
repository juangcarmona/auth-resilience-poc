import { useState, type FormEvent } from 'react';
import './DrLoginForm.css';

interface DrLoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export function DrLoginForm({ onLogin }: DrLoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dr-login-container">
      <div className="dr-login-card">
        <div className="dr-login-header">
          <div className="dr-mode-badge">DISASTER RECOVERY MODE</div>
          <h1>Weather Operations</h1>
          <p>Federated authentication unavailable. Use local credentials.</p>
        </div>

        <form onSubmit={handleSubmit} className="dr-login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              disabled={isSubmitting}
              placeholder="Enter username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting || !username || !password}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="dr-login-footer">
          <p className="dr-users-hint">Test users: admin, operator, tuner</p>
          <p className="dr-disclaimer">POC only - not for production use</p>
        </div>
      </div>
    </div>
  );
}
