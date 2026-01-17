# Troubleshooting - Problemas na Criação de Usuários

## Problema: Criação de usuário não está funcionando

### Passos para Diagnosticar

1. **Execute o script de diagnóstico:**
   - Abra o SQL Editor no Supabase
   - Execute o arquivo `supabase_debug_trigger.sql`
   - Verifique se o trigger e a função existem

2. **Verifique se as colunas existem:**
   - Execute no SQL Editor:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = 'profiles';
   ```
   - Certifique-se de que as colunas `role`, `onboarding_completed`, `patent` e `quiz_score` existem

3. **Execute o script de correção:**
   - Execute `supabase_fix_trigger_robust.sql` no SQL Editor
   - Este script cria uma versão mais robusta do trigger com tratamento de erros

4. **Verifique as políticas RLS:**
   - Execute:
   ```sql
   SELECT policyname, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'profiles';
   ```
   - Deve haver uma política "System can insert profiles" com `cmd = 'INSERT'`

### Soluções Implementadas

1. **Código atualizado (`app/actions/auth.ts`):**
   - Agora tenta buscar o perfil várias vezes (até 5 tentativas)
   - Se o trigger falhar, cria o perfil manualmente como fallback
   - Melhor tratamento de erros

2. **Trigger robusto (`supabase_fix_trigger_robust.sql`):**
   - Tratamento de erros melhorado
   - Verifica se o perfil já existe antes de criar
   - Logs mais detalhados

### Teste Manual

Para testar se o trigger está funcionando:

1. Crie um usuário de teste via SQL:
   ```sql
   -- Isso deve disparar o trigger automaticamente
   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
   VALUES (
     gen_random_uuid(),
     'teste@example.com',
     crypt('senha123', gen_salt('bf')),
     NOW(),
     NOW(),
     NOW(),
     '{"role": "professional", "full_name": "Usuário Teste"}'::jsonb
   );
   ```

2. Verifique se o perfil foi criado:
   ```sql
   SELECT * FROM public.profiles 
   WHERE email = 'teste@example.com';
   ```

### Erros Comuns

1. **"column role does not exist"**
   - Solução: Execute `supabase_crewmatch_setup_fixed.sql` primeiro

2. **"permission denied for table profiles"**
   - Solução: Verifique as políticas RLS e execute `supabase_fix_trigger_robust.sql`

3. **"trigger does not exist"**
   - Solução: Execute `supabase_fix_trigger_robust.sql` para recriar o trigger

### Próximos Passos

1. Execute `supabase_fix_trigger_robust.sql` no Supabase
2. Tente criar um novo usuário pelo formulário
3. Verifique o console do navegador para erros
4. Se ainda não funcionar, execute `supabase_debug_trigger.sql` e compartilhe os resultados

