-- =====================================================
-- SCRIPT DE CORREÇÃO ROBUSTA - Trigger de Criação de Perfil
-- Este script cria uma versão mais robusta do trigger
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Remover trigger e função antigos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Criar função handle_new_user melhorada com tratamento de erros
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
  profile_exists BOOLEAN;
BEGIN
  -- Verificar se o perfil já existe (evitar duplicatas)
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE NOTICE 'Perfil já existe para usuário %', NEW.id;
    RETURN NEW;
  END IF;

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
    user_full_name,
    split_part(NEW.email, '@', 1)
  );

  -- Inserir perfil na tabela public.profiles
  -- Usar INSERT com ON CONFLICT para evitar erros de duplicata
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
    COALESCE(NEW.email, ''),
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
    email = COALESCE(EXCLUDED.email, profiles.email),
    name = COALESCE(EXCLUDED.name, profiles.name),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();

  RAISE NOTICE 'Perfil criado com sucesso para usuário % com role %', NEW.id, user_role;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não quebra o registro do usuário
    RAISE WARNING 'Erro ao criar perfil para usuário %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    -- Retornar NEW mesmo com erro para não impedir criação do usuário
    RETURN NEW;
END;
$$;

-- 3. Criar trigger que executa após inserção em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Garantir que as políticas RLS permitem inserção via trigger
-- Remover políticas antigas
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Política: Sistema pode inserir perfis (via trigger com SECURITY DEFINER)
CREATE POLICY "System can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- 5. Verificação final
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Verificação do Trigger:';
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
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'System can insert profiles'
  ) THEN
    RAISE NOTICE '✓ Política de inserção criada';
  ELSE
    RAISE WARNING '✗ Política de inserção não encontrada';
  END IF;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Para testar, crie um novo usuário e verifique se o perfil foi criado.';
  RAISE NOTICE '=====================================================';
END $$;

