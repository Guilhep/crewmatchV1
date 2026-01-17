-- =====================================================
-- SCRIPT COMPLETO DE AUTENTICAÇÃO - CREW MATCH
-- Garante que full_name seja salvo corretamente
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Garantir que a tabela profiles existe com todas as colunas necessárias
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar colunas que podem não existir
DO $$ 
BEGIN
  -- Adicionar role se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN role TEXT CHECK (role IN ('professional', 'company'));
    RAISE NOTICE 'Coluna role adicionada';
  END IF;

  -- Adicionar onboarding_completed se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN onboarding_completed BOOLEAN DEFAULT false NOT NULL;
    RAISE NOTICE 'Coluna onboarding_completed adicionada';
  END IF;

  -- Adicionar patent se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'patent'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN patent TEXT CHECK (patent IN ('bronze', 'prata', 'ouro')) DEFAULT 'bronze';
    RAISE NOTICE 'Coluna patent adicionada';
  END IF;

  -- Adicionar quiz_score se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'quiz_score'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN quiz_score INTEGER DEFAULT 0;
    RAISE NOTICE 'Coluna quiz_score adicionada';
  END IF;
END $$;

-- 3. Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;

-- 5. Criar novas políticas RLS
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

-- 6. Remover função e trigger antigos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 7. Criar função handle_new_user CORRIGIDA - GARANTE QUE full_name SEJA SALVO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Verificar se o perfil já existe
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RAISE NOTICE 'Perfil já existe para usuário %', NEW.id;
    RETURN NEW;
  END IF;

  -- CRUCIAL: Extrair full_name dos metadados (prioridade máxima)
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',  -- Primeira prioridade
    NEW.raw_user_meta_data->>'name',        -- Segunda prioridade
    split_part(COALESCE(NEW.email, ''), '@', 1)  -- Fallback
  );

  -- Extrair name (pode ser igual ao full_name ou diferente)
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    user_full_name,
    split_part(COALESCE(NEW.email, ''), '@', 1)
  );

  -- Extrair role dos metadados
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'professional' -- Default
  );

  -- Validar role
  IF user_role NOT IN ('professional', 'company') THEN
    user_role := 'professional';
  END IF;

  -- Extrair email
  user_email := COALESCE(NEW.email, '');

  -- Inserir perfil na tabela public.profiles
  -- IMPORTANTE: Garantir que full_name seja salvo
  INSERT INTO public.profiles (
    id,
    email,
    name,
    full_name,  -- <-- CRUCIAL: Esta coluna deve ser preenchida
    role,
    onboarding_completed,
    patent,
    quiz_score,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_email,
    user_name,
    user_full_name,  -- <-- CRUCIAL: Usando o valor extraído dos metadados
    user_role,
    CASE WHEN user_role = 'company' THEN true ELSE false END,
    'bronze',
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    name = COALESCE(EXCLUDED.name, profiles.name),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),  -- <-- Atualizar se necessário
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();

  RAISE NOTICE 'Perfil criado para usuário %: full_name=%, name=%, role=%', 
    NEW.id, user_full_name, user_name, user_role;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil para usuário %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

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
CREATE INDEX IF NOT EXISTS profiles_patent_idx ON public.profiles(patent);

-- 12. Verificação final
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Verificação da Configuração:';
  RAISE NOTICE '=====================================================';
  
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    RAISE NOTICE '✓ Trigger on_auth_user_created criado';
  ELSE
    RAISE WARNING '✗ Trigger não encontrado';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE NOTICE '✓ Função handle_new_user criada';
  ELSE
    RAISE WARNING '✗ Função não encontrada';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    RAISE NOTICE '✓ Coluna full_name existe na tabela profiles';
  ELSE
    RAISE WARNING '✗ Coluna full_name não encontrada';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    RAISE NOTICE '✓ Coluna role existe na tabela profiles';
  ELSE
    RAISE WARNING '✗ Coluna role não encontrada';
  END IF;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Configuração concluída!';
  RAISE NOTICE '=====================================================';
END $$;

