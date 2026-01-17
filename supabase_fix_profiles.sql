-- =====================================================
-- CREWMATCH - VERIFICAR E CORRIGIR TABELA PROFILES
-- =====================================================

-- 1. Verificar se a coluna account_type existe
DO $$ 
BEGIN
    -- Adicionar coluna account_type se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'account_type'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN account_type TEXT CHECK (account_type IN ('professional', 'company'));
        
        RAISE NOTICE 'Coluna account_type adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna account_type já existe.';
    END IF;
    
    -- Adicionar coluna company_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN company_name TEXT;
        
        RAISE NOTICE 'Coluna company_name adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna company_name já existe.';
    END IF;
    
    -- Adicionar coluna cnpj se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'cnpj'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN cnpj TEXT;
        
        RAISE NOTICE 'Coluna cnpj adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna cnpj já existe.';
    END IF;
    
    -- Adicionar coluna onboarding_completed se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Coluna onboarding_completed adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna onboarding_completed já existe.';
    END IF;
END $$;

-- 2. Verificar estrutura da tabela profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Verificar se há usuários sem account_type definido
SELECT 
    id,
    email,
    name,
    account_type,
    company_name,
    cnpj,
    onboarding_completed
FROM public.profiles
WHERE account_type IS NULL
LIMIT 10;

-- 4. (OPCIONAL) Atualizar usuários existentes sem account_type
-- Descomente as linhas abaixo se quiser definir um tipo padrão para usuários existentes

-- UPDATE public.profiles
-- SET account_type = 'professional'
-- WHERE account_type IS NULL;

-- 5. Verificar contagem de usuários por tipo
SELECT 
    account_type,
    COUNT(*) as total
FROM public.profiles
GROUP BY account_type;

-- =====================================================
-- INSTRUÇÕES
-- =====================================================
-- 
-- Este script:
-- 1. Adiciona as colunas necessárias se não existirem
-- 2. Mostra a estrutura atual da tabela profiles
-- 3. Lista usuários sem account_type definido
-- 4. Mostra estatísticas de usuários por tipo
--
-- Execute este script no SQL Editor do Supabase
-- =====================================================
