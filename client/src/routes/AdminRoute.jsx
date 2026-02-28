import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

export default function AdminRoute({ children }) {
  const disableClerk = String(import.meta.env.VITE_DISABLE_CLERK || '').toLowerCase() === 'true';
  if (disableClerk) {
    return children;
  }

  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return <div className="p-6">Loading...</div>;
  }

  const roles = user?.publicMetadata?.roles || [];
  const role = user?.publicMetadata?.role;
  const isAdmin = roles.includes('admin') || role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
