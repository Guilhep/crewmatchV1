-- =====================================================
-- CONFIGURAÇÃO DO SUPABASE STORAGE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- IMPORTANTE: Antes de executar este script, você precisa:
-- 1. Criar o bucket 'profiles' manualmente no Supabase Dashboard
-- 2. Marcar o bucket como PÚBLICO
-- 3. Depois executar este script para criar as políticas

-- =====================================================
-- POLÍTICAS DE ACESSO AO BUCKET 'profiles'
-- =====================================================

-- 1. Permitir que todos vejam as imagens (leitura pública)
CREATE POLICY "Public Access - Anyone can view images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profiles' );

-- 2. Permitir que usuários autenticados façam upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

-- 3. Permitir que usuários atualizem suas próprias imagens
-- A função storage.foldername extrai o user_id do caminho do arquivo
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Permitir que usuários deletem suas próprias imagens
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Execute esta query para verificar se as políticas foram criadas:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- =====================================================
-- ESTRUTURA DE PASTAS ESPERADA
-- =====================================================

-- O código da aplicação cria automaticamente estas pastas:
-- 
-- profiles/
-- ├── avatars/
-- │   └── {user_id}/
-- │       └── avatar.png
-- ├── covers/
-- │   └── {user_id}/
-- │       └── cover.png
-- └── portfolio/
--     └── {user_id}/
--         ├── portfolio-0.{ext}
--         ├── portfolio-1.{ext}
--         └── portfolio-2.{ext}

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- Se você receber erro "new row violates row-level security policy":
-- 1. Verifique se o bucket 'profiles' está marcado como PÚBLICO
-- 2. Verifique se as políticas acima foram criadas
-- 3. Tente deletar e recriar as políticas se necessário

-- Para deletar todas as políticas e recriá-las:
-- DROP POLICY IF EXISTS "Public Access - Anyone can view images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
-- (Depois execute as políticas CREATE acima novamente)
