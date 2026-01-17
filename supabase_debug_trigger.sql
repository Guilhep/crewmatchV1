-- =====================================================
-- SCRIPT DE DEBUG - Verificar Trigger e Perfis
-- Execute este script para diagnosticar problemas
-- =====================================================

-- 1. Verificar se o trigger existe
SELECT 
  tgname as trigger_name,
  tgtype,
  tgenabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 2. Verificar se a função existe
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Verificar estrutura da tabela profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Verificar políticas RLS
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
WHERE tablename = 'profiles';

-- 5. Verificar últimos usuários criados (sem perfil)
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'role' as role_from_metadata,
  CASE WHEN p.id IS NULL THEN 'SEM PERFIL' ELSE 'COM PERFIL' END as perfil_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 6. Verificar se há erros no log do trigger (se disponível)
-- Nota: Isso pode não funcionar dependendo das permissões

