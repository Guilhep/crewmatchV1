-- =====================================================
-- CREWMATCH - CORREÇÃO COMPLETA DO SISTEMA
-- =====================================================
-- Execute este script completo no SQL Editor do Supabase

-- 1. Verificar e adicionar colunas necessárias na tabela profiles
DO $$ 
BEGIN
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
END $$;

-- 2. Criar ou substituir a função de trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Habilitar RLS na tabela profiles se não estiver
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Recriar políticas de acesso para profiles
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Perfis públicos são visíveis para todos" ON public.profiles;

-- Política para ver próprio perfil
CREATE POLICY "Usuários podem ver seus próprios perfis"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política para atualizar próprio perfil
CREATE POLICY "Usuários podem atualizar seus próprios perfis"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para ver perfis públicos (necessário para matching)
CREATE POLICY "Perfis públicos são visíveis para todos"
  ON public.profiles
  FOR SELECT
  USING (true);

-- 6. Criar tabelas de jobs (se não existirem)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10, 2),
  location TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT title_not_empty CHECK (char_length(title) > 0),
  CONSTRAINT description_not_empty CHECK (char_length(description) > 0)
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

-- 7. Criar índices
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);

-- 8. Habilitar RLS nas tabelas de jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- 9. Políticas para jobs
DROP POLICY IF EXISTS "Jobs ativos são visíveis para todos" ON public.jobs;
DROP POLICY IF EXISTS "Empresas podem criar jobs" ON public.jobs;
DROP POLICY IF EXISTS "Empresas podem atualizar seus próprios jobs" ON public.jobs;
DROP POLICY IF EXISTS "Empresas podem deletar seus próprios jobs" ON public.jobs;

CREATE POLICY "Jobs ativos são visíveis para todos"
  ON public.jobs FOR SELECT
  USING (status = 'open' OR recruiter_id = auth.uid());

CREATE POLICY "Empresas podem criar jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    recruiter_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'company')
  );

CREATE POLICY "Empresas podem atualizar seus próprios jobs"
  ON public.jobs FOR UPDATE
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Empresas podem deletar seus próprios jobs"
  ON public.jobs FOR DELETE
  USING (recruiter_id = auth.uid());

-- 10. Políticas para job_applications
DROP POLICY IF EXISTS "Ver aplicações próprias ou de seus jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Profissionais podem aplicar para jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Atualizar aplicações" ON public.job_applications;

CREATE POLICY "Ver aplicações próprias ou de seus jobs"
  ON public.job_applications FOR SELECT
  USING (
    applicant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.recruiter_id = auth.uid())
  );

CREATE POLICY "Profissionais podem aplicar para jobs"
  ON public.job_applications FOR INSERT
  WITH CHECK (
    applicant_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'professional')
  );

CREATE POLICY "Atualizar aplicações"
  ON public.job_applications FOR UPDATE
  USING (
    applicant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.recruiter_id = auth.uid())
  );

-- 11. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Mostrar estrutura da tabela profiles
SELECT 
    'Estrutura da tabela profiles:' as info,
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Mostrar tabelas criadas
SELECT 
    'Tabelas criadas:' as info,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'jobs', 'job_applications');

-- Mostrar políticas
SELECT 
    'Políticas RLS:' as info,
    tablename,
    policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'jobs', 'job_applications');

-- =====================================================
-- FIM - Sistema configurado com sucesso!
-- =====================================================
