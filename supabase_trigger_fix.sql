-- =====================================================
-- CREWMATCH - CORREÇÃO DO TRIGGER
-- =====================================================
-- Este script corrige o trigger para NÃO sobrescrever dados já salvos

-- Criar ou substituir função de trigger MELHORADA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir perfil básico, mas NÃO sobrescrever se já existir
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
  ON CONFLICT (id) DO NOTHING; -- NÃO sobrescrever se já existir!
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
SELECT 'Trigger atualizado com sucesso!' as status;

-- Mostrar a função
SELECT 'Função do trigger:' as info;
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- =====================================================
-- IMPORTANTE
-- =====================================================
-- Agora o trigger:
-- 1. Cria perfil básico quando usuário é criado
-- 2. NÃO sobrescreve se o perfil já existir
-- 3. O OnboardingWizard pode atualizar livremente depois
-- =====================================================
