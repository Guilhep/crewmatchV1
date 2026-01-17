import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase-client';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: () => void;
}

/**
 * Componente que protege rotas baseado no estado de autenticação
 * 
 * @param requireAuth - Se true, requer autenticação. Se false, requer que o usuário NÃO esteja autenticado
 * @param redirectTo - Callback para redirecionar quando a condição não for atendida
 */
const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo,
}) => {
  const { user, loading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Se Supabase não está configurado, permitir acesso (modo desenvolvimento)
    if (!isSupabaseConfigured()) {
      return;
    }

    // Aguardar carregamento inicial
    if (loading) return;

    // Se requer autenticação mas usuário não está autenticado
    if (requireAuth && !user && !hasRedirected) {
      setHasRedirected(true);
      redirectTo?.();
      return;
    }

    // Se requer que o usuário NÃO esteja autenticado (ex: landing page)
    if (!requireAuth && user && !hasRedirected) {
      setHasRedirected(true);
      redirectTo?.();
      return;
    }
  }, [user, loading, requireAuth, redirectTo, hasRedirected]);

  // Se Supabase não está configurado, renderizar conteúdo (modo desenvolvimento)
  if (!isSupabaseConfigured()) {
    return <>{children}</>;
  }

  // Mostrar loading enquanto verifica autenticação (máximo 3 segundos)
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

  // Se requer autenticação mas não há usuário, não renderizar (já está redirecionando)
  if (requireAuth && !user) {
    return null;
  }

  // Se requer que o usuário NÃO esteja autenticado mas está autenticado, não renderizar
  if (!requireAuth && user) {
    return null;
  }

  // Renderizar conteúdo
  return <>{children}</>;
};

export default AuthGuard;
