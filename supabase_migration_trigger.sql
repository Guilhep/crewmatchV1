-- ============================================
-- Migration: Trigger para criar perfil automaticamente
-- Resolve erro 500 / RLS ao registrar usuários
-- Execute este script no SQL Editor do Supabase
-- ============================================

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

-- 4. Remover trigger e função existentes (se houver)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Criar função SECURITY DEFINER para criar perfil automaticamente
-- Usando SECURITY DEFINER com permissões explícitas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  user_full_name TEXT;
BEGIN
  -- Extrair dados do usuário criado (NEW já está disponível no trigger)
  user_email := COALESCE(NEW.email, '');
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(user_email, '@', 1)
  );
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULL
  );
  
  -- Inserir perfil na tabela profiles
  INSERT INTO public.profiles (id, email, name, full_name, level_id, quiz_score)
  VALUES (
    NEW.id,
    user_email,
    user_name,
    user_full_name,
    NULL, -- level_id será definido após o quiz
    0     -- quiz_score inicial
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Inserir registro inicial de onboarding
  INSERT INTO public.onboarding_progress (id, step_completed)
  VALUES (NEW.id, 'account_created')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não quebra o registro do usuário
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. Criar trigger que executa após INSERT em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Políticas RLS para profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Usuários podem ler seu próprio perfil
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Perfis públicos podem ser visualizados por todos (para matching)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- 8. Políticas RLS para onboarding_progress
DROP POLICY IF EXISTS "Users can read own onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can update own onboarding progress" ON public.onboarding_progress;

CREATE POLICY "Users can read own onboarding progress"
  ON public.onboarding_progress FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress FOR UPDATE
  USING (auth.uid() = id);

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_level_id ON public.profiles(level_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- 10. Comentários para documentação
COMMENT ON FUNCTION public.handle_new_user() IS 'Função trigger que cria automaticamente perfil e registro de onboarding quando um novo usuário é criado no auth.users';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger que executa handle_new_user() após cada INSERT em auth.users';

