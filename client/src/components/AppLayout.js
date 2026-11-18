import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
  FiGrid, FiList, FiBarChart2, FiSettings, FiLogOut, FiMenu, FiX
} from 'react-icons/fi';

const navItems = [
  { to: '/dashboard', icon: <FiGrid />, label: 'Dashboard' },
  { to: '/transactions', icon: <FiList />, label: 'Transactions' },
  { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
  { to: '/settings', icon: <FiSettings />, label: 'Settings' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarLetter = user?.name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="app-shell">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 99, background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">Paisa<span>Bachao</span></div>
          <div className="sidebar-tagline">💰 Smart Student Budget</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.name} />
              : avatarLetter
            }
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout">
            <FiLogOut size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <button
            className="btn-icon"
            style={{ display: 'none' }}
            id="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
          <div>
            <div className="topbar-title">Welcome back, {user?.name?.split(' ')[0]} 👋</div>
            <div className="topbar-subtitle">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        <main className="page-body">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

