import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user) {
    const role = user.role;
    const hasAccess = role === 'admin' || role === 'superadmin' || allowedRoles.includes(role);
    if (!hasAccess) {
      return <Navigate to="/admin" replace />;
    }
  }

  return <Outlet />;
}
