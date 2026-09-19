import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
 const { isAuthenticated, user, loading } = useAuth();

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white">
    <div className="flex flex-col items-center gap-3">
     <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
     <span className="text-sm text-slate-400 font-medium">Carregando autenticação...</span>
    </div>
   </div>
  );
 }

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
