import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/authProvider';
import './TopNav.css';

export function TopNav() {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <nav className="top-nav">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h1>Weather Operations</h1>
        </div>
        <div className="nav-menu" ref={menuRef}>
          <button
            className="user-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <span className="user-icon">👤</span>
            <span className="user-name">{user || 'User'}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          {menuOpen && (
            <div className="user-menu-dropdown">
              <div className="menu-header">
                <div className="menu-user-name">{user || 'Unknown User'}</div>
                <div className="menu-user-roles">
                  {roles.length > 0 ? roles.join(', ') : 'No roles'}
                </div>
              </div>
              <div className="menu-divider" />
              <button
                className="menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
              >
                <span>👤</span> User Details
              </button>
              <div className="menu-divider" />
              <button
                className="menu-item menu-item-danger"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
