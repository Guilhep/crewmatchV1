-- ============================================
-- Script SQL para Configuração do Onboarding
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Criar tabela profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  level_id TEXT CHECK (level_id IN ('silver', 'bronze', 'trainee')),
  quiz_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Política para usuários lerem seu próprio perfil
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política para usuários criarem seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_level_id ON profiles(level_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

