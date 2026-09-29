import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Permission } from '../api/client';

export function ProtectedRoute({ permission }: { permission?: Permission }) {
  const location = useLocation();
  const { isAuthenticated, isLoading, can } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg text-text-main flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-bold text-text-muted" role="status">
          <Loader2 className="animate-spin text-primary" size={20} />
          Validando sessão...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (permission && !can(permission)) {
    return <Navigate to="/painel" replace state={{ accessDenied: true }} />;
  }

  return <Outlet />;
}
