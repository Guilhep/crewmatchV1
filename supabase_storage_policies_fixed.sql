-- =====================================================
-- CONFIGURAÇÃO CORRIGIDA DO SUPABASE STORAGE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- PASSO 1: DELETAR POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Public Access - Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- PASSO 2: CRIAR NOVAS POLÍTICAS CORRIGIDAS

-- 1. Permitir que todos vejam as imagens do bucket profiles
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'profiles' );

-- 2. Permitir que usuários autenticados façam upload no bucket profiles
CREATE POLICY "Authenticated users can upload to profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'profiles' );

-- 3. Permitir que usuários autenticados atualizem arquivos no bucket profiles
CREATE POLICY "Authenticated users can update in profiles"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'profiles' )
WITH CHECK ( bucket_id = 'profiles' );

-- 4. Permitir que usuários autenticados deletem arquivos no bucket profiles
CREATE POLICY "Authenticated users can delete from profiles"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'profiles' );

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Execute esta query para verificar se as políticas foram criadas:
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%profile%'
ORDER BY policyname;

-- Você deve ver 4 políticas:
-- 1. Anyone can view profile images (SELECT, public)
-- 2. Authenticated users can upload to profiles (INSERT, authenticated)
-- 3. Authenticated users can update in profiles (UPDATE, authenticated)
-- 4. Authenticated users can delete from profiles (DELETE, authenticated)
