-- =====================================================
-- SCHEMA MULTI-USER TYPES - CREW MATCH
-- Suporte para Profissional (Freelancer) e Produtora (Empresa)
-- =====================================================

-- =====================================================
-- PARTE 1: ATUALIZAR TABELA PROFILES
-- =====================================================

-- 1. Adicionar coluna account_type se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'account_type'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN account_type TEXT CHECK (account_type IN ('professional', 'company')) DEFAULT 'professional';
    RAISE NOTICE 'Coluna account_type adicionada';
  END IF;
END $$;

-- 2. Adicionar coluna cnpj se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'cnpj'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN cnpj TEXT UNIQUE;
    RAISE NOTICE 'Coluna cnpj adicionada';
  END IF;
END $$;

-- 3. Adicionar coluna company_name se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'company_name'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN company_name TEXT;
    RAISE NOTICE 'Coluna company_name adicionada';
  END IF;
END $$;

-- 4. Criar índice para account_type (para queries mais rápidas)
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);

-- 5. Criar índice para cnpj (já é unique, mas índice ajuda em buscas)
CREATE INDEX IF NOT EXISTS idx_profiles_cnpj ON public.profiles(cnpj) WHERE cnpj IS NOT NULL;

-- =====================================================
-- PARTE 2: CRIAR TABELA JOBS (VAGAS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) > 0 AND char_length(description) <= 5000),
  budget DECIMAL(10, 2),
  location TEXT CHECK (char_length(location) <= 200),
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para JOBS
-- Leitura: Todos os usuários autenticados podem ver vagas abertas
DROP POLICY IF EXISTS "Authenticated users can view open jobs" ON public.jobs;
CREATE POLICY "Authenticated users can view open jobs"
  ON public.jobs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Leitura: Recrutadores podem ver suas próprias vagas (mesmo fechadas)
DROP POLICY IF EXISTS "Recruiters can view own jobs" ON public.jobs;
CREATE POLICY "Recruiters can view own jobs"
  ON public.jobs
  FOR SELECT
  USING (
    auth.uid() = recruiter_id
    OR status = 'open'
  );

-- Criação: Apenas usuários do tipo 'company' podem criar vagas
DROP POLICY IF EXISTS "Companies can create jobs" ON public.jobs;
CREATE POLICY "Companies can create jobs"
  ON public.jobs
  FOR INSERT
  WITH CHECK (
    auth.uid() = recruiter_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.account_type = 'company'
    )
  );

-- Atualização: Apenas o recrutador dono pode atualizar
DROP POLICY IF EXISTS "Recruiters can update own jobs" ON public.jobs;
CREATE POLICY "Recruiters can update own jobs"
  ON public.jobs
  FOR UPDATE
  USING (auth.uid() = recruiter_id);

-- Exclusão: Apenas o recrutador dono pode deletar
DROP POLICY IF EXISTS "Recruiters can delete own jobs" ON public.jobs;
CREATE POLICY "Recruiters can delete own jobs"
  ON public.jobs
  FOR DELETE
  USING (auth.uid() = recruiter_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON public.jobs(status, created_at DESC);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PARTE 3: CRIAR TABELA JOB_APPLICATIONS (CANDIDATURAS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Constraint único: Um usuário só pode se aplicar uma vez por vaga
  UNIQUE(job_id, applicant_id),
  -- Constraint: Apenas profissionais podem se candidatar
  CONSTRAINT applicant_must_be_professional CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = applicant_id
      AND profiles.account_type = 'professional'
    )
  )
);

-- Habilitar RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para JOB_APPLICATIONS
-- Leitura: Recrutadores podem ver candidaturas de suas vagas
DROP POLICY IF EXISTS "Recruiters can view applications to own jobs" ON public.job_applications;
CREATE POLICY "Recruiters can view applications to own jobs"
  ON public.job_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

-- Leitura: Candidatos podem ver suas próprias candidaturas
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.job_applications;
CREATE POLICY "Applicants can view own applications"
  ON public.job_applications
  FOR SELECT
  USING (auth.uid() = applicant_id);

-- Criação: Apenas profissionais autenticados podem se candidatar
DROP POLICY IF EXISTS "Professionals can create applications" ON public.job_applications;
CREATE POLICY "Professionals can create applications"
  ON public.job_applications
  FOR INSERT
  WITH CHECK (
    auth.uid() = applicant_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.account_type = 'professional'
    )
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.status = 'open'
    )
  );

-- Exclusão: Candidatos podem remover suas próprias candidaturas
DROP POLICY IF EXISTS "Applicants can delete own applications" ON public.job_applications;
CREATE POLICY "Applicants can delete own applications"
  ON public.job_applications
  FOR DELETE
  USING (auth.uid() = applicant_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON public.job_applications(created_at DESC);

-- =====================================================
-- PARTE 4: FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar se usuário é empresa (útil para validações)
CREATE OR REPLACE FUNCTION is_company(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_id
    AND profiles.account_type = 'company'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é profissional (útil para validações)
CREATE OR REPLACE FUNCTION is_professional(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_id
    AND profiles.account_type = 'professional'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 5: VIEWS ÚTEIS (OPCIONAL, MAS RECOMENDADO)
-- =====================================================

-- View para listar vagas com informações do recrutador
CREATE OR REPLACE VIEW public.jobs_with_recruiter AS
SELECT 
  j.id,
  j.recruiter_id,
  j.title,
  j.description,
  j.budget,
  j.location,
  j.status,
  j.created_at,
  j.updated_at,
  p.name AS recruiter_name,
  p.company_name,
  p.avatar_url AS recruiter_avatar,
  (SELECT COUNT(*) FROM public.job_applications WHERE job_id = j.id) AS applications_count
FROM public.jobs j
INNER JOIN public.profiles p ON p.id = j.recruiter_id;

-- View para listar candidaturas com informações do candidato e da vaga
CREATE OR REPLACE VIEW public.applications_with_details AS
SELECT 
  ja.id,
  ja.job_id,
  ja.applicant_id,
  ja.created_at,
  j.title AS job_title,
  j.recruiter_id,
  p.name AS applicant_name,
  p.full_name AS applicant_full_name,
  p.avatar_url AS applicant_avatar,
  p.main_skill AS applicant_skill,
  p.level_id AS applicant_level
FROM public.job_applications ja
INNER JOIN public.jobs j ON j.id = ja.job_id
INNER JOIN public.profiles p ON p.id = ja.applicant_id;

-- =====================================================
-- PARTE 6: MIGRAÇÃO DE DADOS EXISTENTES (SE NECESSÁRIO)
-- =====================================================

-- Se já existem perfis sem account_type, definir como 'professional' por padrão
UPDATE public.profiles
SET account_type = 'professional'
WHERE account_type IS NULL;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
