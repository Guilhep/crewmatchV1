// Re-export do cliente Supabase melhorado
export { supabase, isSupabaseConfigured } from './supabase-client';

// Tipos para o banco de dados
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  level_id: 'silver' | 'bronze' | 'trainee' | null;
  quiz_score: number;
  created_at: string;
  bio?: string;
  portfolio_url?: string;
  avatar_url?: string;
  cover_url?: string;
  role?: string;
}

