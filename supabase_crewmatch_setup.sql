-- =====================================================
-- SCRIPT DE CONFIGURAÇÃO - CREW MATCH
-- Sistema de Autenticação e Onboarding
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Atualizar/Criar tabela profiles com colunas necessárias
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('professional', 'company')) NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  main_skill TEXT,
  level_id TEXT CHECK (level_id IN ('silver', 'bronze', 'trainee')),
  quiz_score INTEGER DEFAULT 0,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  portfolio JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;

-- 4. Criar novas políticas RLS
-- Política: Usuários podem ler todos os perfis (para matching)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Política: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Política: Sistema pode inserir perfis (via trigger)
CREATE POLICY "System can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- 5. Remover função antiga (se existir)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 6. Criar função handle_new_user com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
  user_name TEXT;
BEGIN
  -- Extrair role dos metadados do usuário
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'professional' -- Default para professional se não especificado
  );

  -- Validar role
  IF user_role NOT IN ('professional', 'company') THEN
    user_role := 'professional';
  END IF;

  -- Extrair nome dos metadados
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    user_full_name
  );

  -- Inserir perfil na tabela public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    name,
    full_name,
    role,
    onboarding_completed,
    patent,
    quiz_score,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_full_name,
    user_role,
    -- Produtoras não precisam de onboarding, profissionais sim
    CASE WHEN user_role = 'company' THEN true ELSE false END,
    'bronze', -- Patente padrão
    0, -- Score inicial
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- 7. Remover trigger antigo (se existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 8. Criar trigger que executa após inserção em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 10. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_onboarding_completed_idx ON public.profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS profiles_level_id_idx ON public.profiles(level_id);

-- 12. Criar tabela de questões do quiz (opcional, para armazenar perguntas)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer TEXT NOT NULL,
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Habilitar RLS na tabela quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- 14. Política: Todos podem ler questões do quiz
CREATE POLICY "Quiz questions are viewable by everyone"
  ON public.quiz_questions
  FOR SELECT
  USING (true);

-- 15. Criar tabela de respostas do quiz (opcional, para histórico)
CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Habilitar RLS na tabela quiz_responses
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- 17. Política: Usuários podem ver apenas suas próprias respostas
CREATE POLICY "Users can view own quiz responses"
  ON public.quiz_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- 18. Política: Usuários podem inserir suas próprias respostas
CREATE POLICY "Users can insert own quiz responses"
  ON public.quiz_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 19. Criar índices para quiz_responses
CREATE INDEX IF NOT EXISTS quiz_responses_user_id_idx ON public.quiz_responses(user_id);
CREATE INDEX IF NOT EXISTS quiz_responses_question_id_idx ON public.quiz_responses(question_id);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Verificando configuração...';
  
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    RAISE NOTICE '✓ Trigger criado com sucesso';
  ELSE
    RAISE WARNING '✗ Trigger não encontrado';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE NOTICE '✓ Função handle_new_user criada com sucesso';
  ELSE
    RAISE WARNING '✗ Função não encontrada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    RAISE NOTICE '✓ Coluna role existe na tabela profiles';
  ELSE
    RAISE WARNING '✗ Coluna role não encontrada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
    RAISE NOTICE '✓ Coluna onboarding_completed existe na tabela profiles';
  ELSE
    RAISE WARNING '✗ Coluna onboarding_completed não encontrada';
  END IF;
END $$;
