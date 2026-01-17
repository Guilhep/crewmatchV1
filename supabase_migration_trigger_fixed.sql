-- ============================================
-- Migration: Trigger para criar perfil automaticamente (Versão Supabase)
-- Resolve erro 500 / RLS ao registrar usuários
-- Execute este script no SQL Editor do Supabase
-- ============================================
-- NOTA: No Supabase, triggers em auth.users precisam de permissões especiais
-- Esta versão usa uma abordagem compatível com as limitações do Supabase

-- 1. Garantir que a tabela profiles existe
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT,
  level_id TEXT CHECK (level_id IN ('silver', 'bronze', 'trainee')),
  quiz_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela onboarding_progress (se não existir)
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  step_completed TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS nas tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- 4. Remover função existente (se houver)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Criar função que pode ser chamada pelo cliente após signup
-- Esta função será chamada pelo código do cliente, não por trigger
CREATE OR REPLACE FUNCTION public.handle_new_user(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir perfil na tabela profiles
  INSERT INTO public.profiles (id, email, name, full_name, level_id, quiz_score)
  VALUES (
    p_user_id,
    p_email,
    COALESCE(p_name, split_part(p_email, '@', 1)),
    p_full_name,
    NULL, -- level_id será definido após o quiz
    0     -- quiz_score inicial
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  
  -- Inserir registro inicial de onboarding
  INSERT INTO public.onboarding_progress (id, step_completed)
  VALUES (p_user_id, 'account_created')
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- 6. Política RLS para permitir que usuários chamem a função
-- (A função já é SECURITY DEFINER, então isso é apenas para documentação)

-- 7. Políticas RLS para profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Usuários podem ler seu próprio perfil
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Usuários podem inserir seu próprio perfil (via função)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Perfis públicos podem ser visualizados por todos (para matching)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- 8. Políticas RLS para onboarding_progress
DROP POLICY IF EXISTS "Users can read own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can update own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can insert own onboarding progress" ON public.onboarding_progress;

CREATE POLICY "Users can read own onboarding progress"
  ON public.onboarding_progress FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own onboarding progress"
  ON public.onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_level_id ON public.profiles(level_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- 10. Comentários para documentação
COMMENT ON FUNCTION public.handle_new_user(UUID, TEXT, TEXT, TEXT) IS 'Função que cria perfil e registro de onboarding. Deve ser chamada pelo cliente após signup bem-sucedido.';

-- ============================================
-- IMPORTANTE: Como usar esta função
-- ============================================
-- No código do cliente (após signup bem-sucedido), chame:
-- 
-- const { data, error } = await supabase.rpc('handle_new_user', {
--   p_user_id: user.id,
--   p_email: user.email,
--   p_name: user.user_metadata.name,
--   p_full_name: user.user_metadata.full_name
-- });

