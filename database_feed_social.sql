-- =====================================================
-- SCHEMA FEED SOCIAL - CREW MATCH
-- Tabelas para sistema de posts, likes e comentários
-- =====================================================

-- 1. Tabela de Posts
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Tabela de Likes (com constraint único para evitar likes duplicados)
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Constraint único: um usuário só pode curtir um post uma vez
  UNIQUE(user_id, post_id)
);

-- 3. Tabela de Comentários
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Habilitar RLS em todas as tabelas
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para POSTS
-- Leitura: Todos os usuários autenticados podem ver posts
DROP POLICY IF EXISTS "Authenticated users can view posts" ON public.posts;
CREATE POLICY "Authenticated users can view posts"
  ON public.posts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Criação: Apenas usuários autenticados podem criar posts
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Atualização: Apenas o dono pode atualizar
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
  ON public.posts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Exclusão: Apenas o dono pode deletar
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts"
  ON public.posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Políticas RLS para LIKES
-- Leitura: Todos os usuários autenticados podem ver likes
DROP POLICY IF EXISTS "Authenticated users can view likes" ON public.post_likes;
CREATE POLICY "Authenticated users can view likes"
  ON public.post_likes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Criação: Apenas usuários autenticados podem curtir
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.post_likes;
CREATE POLICY "Authenticated users can create likes"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Exclusão: Apenas o dono pode remover seu like
DROP POLICY IF EXISTS "Users can delete own likes" ON public.post_likes;
CREATE POLICY "Users can delete own likes"
  ON public.post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Políticas RLS para COMENTÁRIOS
-- Leitura: Todos os usuários autenticados podem ver comentários
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.post_comments;
CREATE POLICY "Authenticated users can view comments"
  ON public.post_comments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Criação: Apenas usuários autenticados podem comentar
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.post_comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Atualização: Apenas o dono pode atualizar
DROP POLICY IF EXISTS "Users can update own comments" ON public.post_comments;
CREATE POLICY "Users can update own comments"
  ON public.post_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Exclusão: Apenas o dono pode deletar
DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Users can delete own comments"
  ON public.post_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments(created_at);

-- 9. Trigger para atualizar updated_at em posts
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Trigger para atualizar updated_at em comentários
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.post_comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
