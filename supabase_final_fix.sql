-- =====================================================
-- CREWMATCH - CORREÇÃO FINAL E DEFINITIVA
-- =====================================================
-- Execute este script para corrigir TODOS os problemas

-- 1. Remover constraint NOT NULL da coluna role (se existir)
DO $$ 
BEGIN
    ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;
EXCEPTION
    WHEN undefined_column THEN
        RAISE NOTICE 'Coluna role não existe ainda';
    WHEN others THEN
        RAISE NOTICE 'Constraint já foi removida ou não existe';
END $$;

-- 2. Adicionar/Atualizar colunas necessárias
DO $$ 
BEGIN
    -- role (sem NOT NULL)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT;
    END IF;
    
    -- account_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'account_type'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN account_type TEXT CHECK (account_type IN ('professional', 'company'));
    END IF;
    
    -- company_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'company_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN company_name TEXT;
    END IF;
    
    -- cnpj
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'cnpj'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN cnpj TEXT;
    END IF;
    
    -- onboarding_completed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- level_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'level_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN level_id TEXT;
    END IF;
    
    -- quiz_score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'quiz_score'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN quiz_score INTEGER;
    END IF;
    
    -- created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Criar ou substituir função de trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    full_name, 
    role,
    account_type,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'professional'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'company' THEN 'company'
      ELSE 'professional'
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    account_type = EXCLUDED.account_type,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Recriar políticas
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Perfis públicos são visíveis para todos" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios perfis" ON public.profiles;

CREATE POLICY "Usuários podem ver seus próprios perfis"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Perfis públicos são visíveis para todos"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem inserir seus próprios perfis"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 7. Criar tabelas de jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10, 2),
  location TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

-- 8. Índices
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);

-- 9. RLS para jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jobs ativos são visíveis para todos" ON public.jobs;
DROP POLICY IF EXISTS "Empresas podem criar jobs" ON public.jobs;
DROP POLICY IF EXISTS "Empresas podem atualizar seus próprios jobs" ON public.jobs;
DROP POLICY IF EXISTS "Empresas podem deletar seus próprios jobs" ON public.jobs;

CREATE POLICY "Jobs ativos são visíveis para todos"
  ON public.jobs FOR SELECT USING (status = 'open' OR recruiter_id = auth.uid());

CREATE POLICY "Empresas podem criar jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (recruiter_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'company'));

CREATE POLICY "Empresas podem atualizar seus próprios jobs"
  ON public.jobs FOR UPDATE USING (recruiter_id = auth.uid()) WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Empresas podem deletar seus próprios jobs"
  ON public.jobs FOR DELETE USING (recruiter_id = auth.uid());

-- 10. Políticas para job_applications
DROP POLICY IF EXISTS "Ver aplicações próprias ou de seus jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Profissionais podem aplicar para jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Atualizar aplicações" ON public.job_applications;

CREATE POLICY "Ver aplicações próprias ou de seus jobs"
  ON public.job_applications FOR SELECT
  USING (applicant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.recruiter_id = auth.uid()));

CREATE POLICY "Profissionais podem aplicar para jobs"
  ON public.job_applications FOR INSERT
  WITH CHECK (applicant_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'professional'));

CREATE POLICY "Atualizar aplicações"
  ON public.job_applications FOR UPDATE
  USING (applicant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.recruiter_id = auth.uid()));

-- 11. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
SELECT 'Estrutura da tabela profiles:' as info;
SELECT column_name, data_type, is_nullable FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles' ORDER BY ordinal_position;

SELECT 'Tabelas criadas:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('profiles', 'jobs', 'job_applications');

-- =====================================================
-- SUCESSO!
-- =====================================================
