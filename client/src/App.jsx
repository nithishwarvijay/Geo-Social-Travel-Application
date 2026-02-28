import { Navigate, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Header from './components/Header';
import AdminDashboard from './pages/AdminDashboard';
import CreatePostPage from './pages/CreatePostPage';
import FeedPage from './pages/FeedPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import MapPage from './pages/MapPage';
import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';

function App() {
  const disableClerk = String(import.meta.env.VITE_DISABLE_CLERK || '').toLowerCase() === 'true';
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (disableClerk) {
      setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    }
  }, [disableClerk]);

  // Listen for storage changes to update authentication state
  useEffect(() => {
    const handleStorageChange = () => {
      if (disableClerk) {
        setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [disableClerk]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Routes>
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/signup/*" element={<SignUpPage />} />
        
        {/* Always show landing page at root */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected routes for authenticated users */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Header />
              <main className="px-4 py-6 md:px-6">
                <Routes>
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/create" element={<CreatePostPage />} />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;