-- =====================================================
-- SCHEMA ESTENDIDO - CREW MATCH
-- Extensão do schema existente para suportar:
-- - Perfis completos (avatar, cover, bio, portfolio)
-- - Jobs (criação e gerenciamento)
-- =====================================================

-- 1. Criar tabela profiles se não existir (com todas as colunas necessárias)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT,
  portfolio_url TEXT,
  role TEXT CHECK (role IN ('professional', 'company')) NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  main_skill TEXT,
  level_id TEXT CHECK (level_id IN ('silver', 'bronze', 'trainee')),
  quiz_score INTEGER DEFAULT 0,
  patent TEXT CHECK (patent IN ('bronze', 'prata', 'ouro')),
  skills TEXT[] DEFAULT '{}',
  portfolio JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar colunas que podem não existir (se a tabela já existir)
DO $$ 
BEGIN
  -- Adicionar cover_url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cover_url TEXT;
  END IF;

  -- Adicionar portfolio_url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'portfolio_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN portfolio_url TEXT;
  END IF;

  -- Adicionar avatar_url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- Adicionar bio se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;

  -- Adicionar patent se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'patent'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN patent TEXT CHECK (patent IN ('bronze', 'prata', 'ouro'));
  END IF;
END $$;

-- 3. Habilitar RLS na tabela profiles (se ainda não estiver habilitado)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS básicas para profiles (remover antigas se existirem e criar novas)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Política: Usuários podem ler todos os perfis
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Política: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Política: Sistema pode inserir perfis
CREATE POLICY "System can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- 5. Criar tabela jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT,
  location TEXT,
  dates TEXT,
  requirements TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft'))
);

-- 6. Habilitar RLS na tabela jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para jobs
-- Todos podem ver jobs ativos
CREATE POLICY "Active jobs are viewable by everyone"
  ON public.jobs
  FOR SELECT
  USING (status = 'active');

-- Apenas o criador pode ver seus próprios jobs (incluindo drafts)
CREATE POLICY "Users can view own jobs"
  ON public.jobs
  FOR SELECT
  USING (auth.uid() = created_by);

-- Apenas produtores (role = 'company') podem criar jobs
CREATE POLICY "Producers can create jobs"
  ON public.jobs
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'company'
    )
  );

-- Apenas o criador pode atualizar seus jobs
CREATE POLICY "Users can update own jobs"
  ON public.jobs
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Apenas o criador pode deletar seus jobs
CREATE POLICY "Users can delete own jobs"
  ON public.jobs
  FOR DELETE
  USING (auth.uid() = created_by);

-- 8. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 9. Criar função para atualizar updated_at automaticamente (se não existir)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Criar trigger para atualizar updated_at em jobs
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Criar trigger para atualizar updated_at em profiles (se não existir)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Criar bucket de storage para avatares e covers (execute no Supabase Storage)
-- NOTA: Execute manualmente no Supabase Dashboard > Storage:
-- - Criar bucket 'avatars' (público)
-- - Criar bucket 'covers' (público)
-- - Criar bucket 'job-images' (público)
-- - Configurar políticas de acesso conforme necessário
