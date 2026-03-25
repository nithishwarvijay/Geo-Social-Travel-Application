import { NavLink, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Globe, Home, Map as MapIcon, PlusSquare, Settings, LogOut, LogIn, User } from 'lucide-react';

export default function Header() {
  const disableClerk = String(import.meta.env.VITE_DISABLE_CLERK || '').toLowerCase() === 'true';
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (disableClerk) {
      setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    }
  }, [disableClerk]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userProfile');
    setIsAuthenticated(false);
    setUserProfile(null);
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (disableClerk) {
    return (
      <header className="nav-header">
        <nav className="nav-inner">
          {/* Brand */}
          <NavLink to="/feed" className="nav-brand">
            <div className="nav-brand-icon-wrapper ring-2 ring-blue-100 flex items-center justify-center bg-blue-600 rounded-xl p-1.5 shadow-sm">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-xl text-slate-800 ml-1">GeoSocial</span>
          </NavLink>

          {/* Nav Links */}
          <div className="nav-links">
            <NavLink
              to="/feed"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Home className="w-4 h-4 nav-link-icon" />
              <span>Feed</span>
            </NavLink>
            <NavLink
              to="/map"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <MapIcon className="w-4 h-4 nav-link-icon" />
              <span>Map</span>
            </NavLink>
            {isAuthenticated && (
                <NavLink
                  to="/create"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <PlusSquare className="w-4 h-4 nav-link-icon" />
                  <span>Create</span>
                </NavLink>
            )}
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link nav-link-admin ${isActive ? 'active' : ''}`}
            >
              <Settings className="w-4 h-4 nav-link-icon" />
              <span>Admin</span>
            </NavLink>
          </div>

          {/* Actions */}
          <div className="nav-actions">
            {isAuthenticated && (
              <NavLink to="/profile" className="nav-profile-link">
                <div className="nav-avatar">
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="nav-profile-name">{userProfile?.name || 'Profile'}</span>
              </NavLink>
            )}
            <span className="nav-dev-badge">⚡ Dev</span>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="nav-btn nav-btn-primary group"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="nav-btn nav-btn-accent group"
              >
                <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Login</span>
              </button>
            )}
          </div>
        </nav>
      </header>
    );
  }

  const { user } = useUser();
  const { signOut } = useClerk();

  const roles = user?.publicMetadata?.roles || [];
  const role = user?.publicMetadata?.role;
  const isAdmin = roles.includes('admin') || role === 'admin';

  return (
    <header className="nav-header">
      <nav className="nav-inner">
        <NavLink to="/feed" className="nav-brand">
          <div className="nav-brand-icon-wrapper ring-2 ring-blue-100 flex items-center justify-center bg-blue-600 rounded-xl p-1.5 shadow-sm">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-xl text-slate-800 ml-1">GeoSocial</span>
        </NavLink>

        {/* Nav Links */}
        <div className="nav-links">
          <NavLink
            to="/feed"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Home className="w-4 h-4 nav-link-icon" />
            <span>Feed</span>
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <MapIcon className="w-4 h-4 nav-link-icon" />
            <span>Map</span>
          </NavLink>
          <NavLink
            to="/create"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <PlusSquare className="w-4 h-4 nav-link-icon" />
            <span>Create</span>
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link nav-link-admin ${isActive ? 'active' : ''}`}
            >
              <Settings className="w-4 h-4 nav-link-icon" />
              <span>Admin</span>
            </NavLink>
          )}
        </div>

        {/* Actions */}
        <div className="nav-actions">
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/login' })}
            className="nav-btn nav-btn-primary group"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Sign out</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
