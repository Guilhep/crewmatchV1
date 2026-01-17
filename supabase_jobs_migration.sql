-- =====================================================
-- CREWMATCH - MIGRAÇÃO/CORREÇÃO DE TABELAS DE JOBS
-- =====================================================
-- Este script pode ser executado mesmo se as tabelas já existirem
-- Ele vai criar ou atualizar conforme necessário

-- 1. Dropar políticas antigas se existirem
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Jobs ativos são visíveis para todos" ON public.jobs;
    DROP POLICY IF EXISTS "Empresas podem criar jobs" ON public.jobs;
    DROP POLICY IF EXISTS "Empresas podem atualizar seus próprios jobs" ON public.jobs;
    DROP POLICY IF EXISTS "Empresas podem deletar seus próprios jobs" ON public.jobs;
    DROP POLICY IF EXISTS "Ver aplicações próprias ou de seus jobs" ON public.job_applications;
    DROP POLICY IF EXISTS "Profissionais podem aplicar para jobs" ON public.job_applications;
    DROP POLICY IF EXISTS "Atualizar aplicações" ON public.job_applications;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- 2. Dropar tabelas se existirem (CUIDADO: isso apaga todos os dados!)
-- Comente estas linhas se quiser preservar dados existentes
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;

-- 3. Criar tabela de jobs (vagas)
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

-- 4. Criar tabela de matches/aplicações
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar aplicações duplicadas
  UNIQUE(job_id, applicant_id)
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de segurança para jobs

-- Qualquer usuário autenticado pode ver jobs ativos
CREATE POLICY "Jobs ativos são visíveis para todos"
  ON public.jobs
  FOR SELECT
  USING (status = 'open' OR recruiter_id = auth.uid());

-- Apenas a empresa dona pode criar jobs
CREATE POLICY "Empresas podem criar jobs"
  ON public.jobs
  FOR INSERT
  WITH CHECK (
    recruiter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND account_type = 'company'
    )
  );

-- Apenas a empresa dona pode atualizar seus jobs
CREATE POLICY "Empresas podem atualizar seus próprios jobs"
  ON public.jobs
  FOR UPDATE
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

-- Apenas a empresa dona pode deletar seus jobs
CREATE POLICY "Empresas podem deletar seus próprios jobs"
  ON public.jobs
  FOR DELETE
  USING (recruiter_id = auth.uid());

-- 8. Políticas de segurança para job_applications

-- Profissionais podem ver suas próprias aplicações
-- Empresas podem ver aplicações para seus jobs
CREATE POLICY "Ver aplicações próprias ou de seus jobs"
  ON public.job_applications
  FOR SELECT
  USING (
    applicant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

-- Apenas profissionais podem criar aplicações
CREATE POLICY "Profissionais podem aplicar para jobs"
  ON public.job_applications
  FOR INSERT
  WITH CHECK (
    applicant_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND account_type = 'professional'
    )
  );

-- Profissionais podem atualizar suas aplicações (ex: retirar candidatura)
-- Empresas podem atualizar status das aplicações
CREATE POLICY "Atualizar aplicações"
  ON public.job_applications
  FOR UPDATE
  USING (
    applicant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

-- 9. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Triggers para atualizar updated_at
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
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Verificar se tudo foi criado corretamente:
SELECT 
  'Tabelas criadas:' as info,
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('jobs', 'job_applications');

SELECT 
  'Políticas criadas:' as info,
  tablename,
  policyname 
FROM pg_policies 
WHERE tablename IN ('jobs', 'job_applications');
