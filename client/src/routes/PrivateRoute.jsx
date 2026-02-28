import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

export default function PrivateRoute({ children }) {
  const disableClerk = String(import.meta.env.VITE_DISABLE_CLERK || '').toLowerCase() === 'true';
  
  if (disableClerk) {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <div className="p-6">Loading...</div>;
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
