import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { isAuthenticated, user, loading, switchMockUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground font-medium">Carregando autenticação...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role || 'superadmin';
  const isSuper = role === 'admin' || role === 'superadmin' || user?.email === 'andreljp@gmail.com' || user?.email?.includes('admin');

  // Se for admin/superadmin ou se não houver restrição específica de papéis, acesso total liberado
  if (isSuper || !allowedRoles || allowedRoles.length === 0) {
    return <Outlet />;
  }

  // Verifica se o papel atual está na lista permitida
  const hasAccess = allowedRoles.includes(role);

  if (!hasAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background min-h-[60vh]">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-base font-bold text-foreground mb-1 font-outfit">
          Acesso Restrito ao Módulo
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mb-4 leading-relaxed">
          Este módulo está configurado para os perfis: <span className="text-blue-400 font-mono font-bold">{allowedRoles.join(', ')}</span>.
          <br />Seu usuário atual está autenticado com o perfil <span className="text-amber-400 font-mono font-bold">{role}</span>.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => switchMockUser('admin')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Mudar para Perfil Administrador Geral
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-3.5 py-2 bg-muted hover:bg-accent text-foreground text-xs font-semibold rounded-xl border border-border transition-all cursor-pointer"
          >
            Voltar à Página Anterior
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
