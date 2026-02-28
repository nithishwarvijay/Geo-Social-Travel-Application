import { NavLink, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';

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
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-4 text-sm font-medium">
            <NavLink to="/" className="text-slate-700 hover:text-slate-900">Feed</NavLink>
            <NavLink to="/map" className="text-slate-700 hover:text-slate-900">Map</NavLink>
            {isAuthenticated && (
              <NavLink to="/create" className="text-slate-700 hover:text-slate-900">Create</NavLink>
            )}
            <NavLink to="/admin" className="text-red-600 hover:text-red-700">Admin</NavLink>
          </div>
          <span className="flex items-center gap-3">
            {isAuthenticated && (
              <NavLink to="/profile" className="text-slate-700 hover:text-slate-900">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:inline">{userProfile?.name || 'Profile'}</span>
                </div>
              </NavLink>
            )}
            <span className="text-sm text-slate-500">Dev Mode</span>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              >
                Login
              </button>
            )}
          </span>
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
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-4 text-sm font-medium">
          <NavLink to="/" className="text-slate-700 hover:text-slate-900">Feed</NavLink>
          <NavLink to="/map" className="text-slate-700 hover:text-slate-900">Map</NavLink>
          <NavLink to="/create" className="text-slate-700 hover:text-slate-900">Create</NavLink>
          {isAdmin && <NavLink to="/admin" className="text-red-600 hover:text-red-700">Admin</NavLink>}
        </div>

        <button
          type="button"
          onClick={() => signOut({ redirectUrl: '/login' })}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}
