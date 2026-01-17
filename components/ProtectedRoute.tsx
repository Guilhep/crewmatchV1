import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'professional' | 'company';
  onUnauthorized?: () => void;
  redirectTo?: () => void;
}

/**
 * Componente de proteção de rotas
 * Verifica se o usuário está autenticado e, opcionalmente, se tem o role necessário
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  onUnauthorized,
  redirectTo,
}) => {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Aguardar carregamento inicial
    if (loading) return;

    // Se não há usuário, redirecionar para login
    if (!user) {
      redirectTo?.();
      return;
    }

    // Se há role requerido, verificar
    if (requiredRole && profile?.role !== requiredRole) {
      // Redirecionar para página de acesso negado ou dashboard
      onUnauthorized?.();
      return;
    }
  }, [user, profile, loading, requiredRole, onUnauthorized, redirectTo]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-offWhite/80">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário, não renderizar nada (já está redirecionando)
  if (!user) {
    return null;
  }

  // Se há role requerido e não corresponde, não renderizar
  if (requiredRole && profile?.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Acesso Negado</h2>
          <p className="text-offWhite/60 mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          {onUnauthorized && (
            <button
              onClick={onUnauthorized}
              className="px-6 py-3 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors"
            >
              Voltar
            </button>
          )}
        </div>
      </div>
    );
  }

  // Renderizar conteúdo protegido
  return <>{children}</>;
};

export default ProtectedRoute;
