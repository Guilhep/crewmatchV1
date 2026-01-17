-- =====================================================
-- SCRIPT DE ATUALIZAÇÃO - CREW MATCH
-- Adicionar campo patent e atualizar estrutura
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Adicionar coluna patent se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'patent'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN patent TEXT CHECK (patent IN ('bronze', 'prata', 'ouro')) DEFAULT 'bronze';
    
    RAISE NOTICE 'Coluna patent adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna patent já existe';
  END IF;
END $$;

-- 2. Garantir que as colunas necessárias existem
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

-- 3. Atualizar valores padrão para patent (se null)
UPDATE public.profiles 
SET patent = 'bronze' 
WHERE patent IS NULL;

-- 4. Garantir que patent não pode ser null
ALTER TABLE public.profiles 
ALTER COLUMN patent SET DEFAULT 'bronze',
ALTER COLUMN patent SET NOT NULL;

-- 5. Criar índice para patent (opcional, para performance)
CREATE INDEX IF NOT EXISTS profiles_patent_idx ON public.profiles(patent);

-- 6. Verificação final
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Verificação da estrutura da tabela profiles:';
  RAISE NOTICE '=====================================================';
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'patent'
  ) THEN
    RAISE NOTICE '✓ Coluna patent existe';
  ELSE
    RAISE WARNING '✗ Coluna patent NÃO encontrada';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    RAISE NOTICE '✓ Coluna role existe';
  ELSE
    RAISE WARNING '✗ Coluna role NÃO encontrada';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'onboarding_completed'
  ) THEN
    RAISE NOTICE '✓ Coluna onboarding_completed existe';
  ELSE
    RAISE WARNING '✗ Coluna onboarding_completed NÃO encontrada';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'quiz_score'
  ) THEN
    RAISE NOTICE '✓ Coluna quiz_score existe';
  ELSE
    RAISE WARNING '✗ Coluna quiz_score NÃO encontrada';
  END IF;
  
  RAISE NOTICE '=====================================================';
END $$;

