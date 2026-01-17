import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Função helper para verificar se o Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== '' && 
    supabaseAnonKey !== '' &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder'));
}

// Criar cliente Supabase de forma segura
let supabase: SupabaseClient;

try {
  if (isSupabaseConfigured()) {
    // Cliente Supabase configurado com persistência de sessão
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token',
      },
    });
  } else {
    // Criar cliente mock para evitar quebra da aplicação
    console.warn(
      '⚠️ Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env'
    );
    // Usar valores placeholder que não quebram a aplicação
    supabase = createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'
    );
  }
} catch (error) {
  console.error('Erro ao inicializar Supabase:', error);
  // Fallback: criar cliente mock mesmo em caso de erro
  supabase = createClient(
    'https://placeholder.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'
  );
}

export { supabase };
