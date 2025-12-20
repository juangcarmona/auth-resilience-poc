import { useAuth } from '../auth/authProvider';
import './UserDetailsPage.css';

export function UserDetailsPage() {
  const { user, roles } = useAuth();

  return (
    <div className="user-details-page">
      <h1>User Details</h1>
      <div className="user-details-card">
        <div className="detail-row">
          <span className="detail-label">Display Name:</span>
          <span className="detail-value">{user || 'Unknown'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Roles:</span>
          <span className="detail-value">
            {roles.length > 0 ? (
              <ul className="roles-list">
                {roles.map((role, index) => (
                  <li key={index}>{role}</li>
                ))}
              </ul>
            ) : (
              'No roles assigned'
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
