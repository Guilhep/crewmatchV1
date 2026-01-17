import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase-client';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  full_name?: string | null;
  level_id: 'silver' | 'bronze' | 'trainee' | null;
  quiz_score: number;
  created_at: string;
  updated_at?: string;
  bio?: string;
  portfolio_url?: string;
  avatar_url?: string;
  cover_url?: string;
  role?: string;
  account_type?: 'professional' | 'company' | null;
  cnpj?: string | null;
  company_name?: string | null;
}

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      // Verificar se Supabase está configurado antes de fazer query
      if (!isSupabaseConfigured()) {
        console.warn('Supabase não configurado, pulando busca de perfil');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Usar maybeSingle() em vez de single() para não dar erro se não existir

      if (profileError) {
        console.warn('Erro ao buscar perfil:', profileError);
        setProfile(null);
        return;
      }

      // Se não encontrou perfil, tentar criar um básico
      if (!data) {
        console.warn('Perfil não encontrado, tentando criar...');
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const userRole = userData.user.user_metadata?.role || 'professional';
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userData.user.email || '',
              name: userData.user.user_metadata?.name || userData.user.email || 'Usuário',
              full_name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || userData.user.email || 'Usuário',
              role: userRole,
              account_type: userRole === 'company' ? 'company' : 'professional',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.error('Erro ao criar perfil:', createError);
            setProfile(null);
            return;
          }

          setProfile(newProfile as UserProfile);
          return;
        }
      }

      setProfile(data as UserProfile);
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      setError(err as Error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      setError(err as Error);
    }
  };

  useEffect(() => {
    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
      setLoading(false);
      return;
    }

    // Verificar sessão inicial
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erro ao verificar sessão:', err);
        setLoading(false);
      });

    // Escutar mudanças de autenticação
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      });
      subscription = sub;
    } catch (err) {
      console.error('Erro ao configurar listener de autenticação:', err);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return {
    user,
    session,
    profile,
    loading,
    error,
    refreshProfile,
    signOut,
  };
}

