# Guia de Migration do Supabase

## Problema: Erro "must be owner of relation users"

No Supabase, você **não pode criar triggers diretamente** na tabela `auth.users` sem permissões de superuser. Por isso, a migration original falha.

## Solução: Função RPC (Recomendada)

Criei uma versão alternativa que funciona perfeitamente no Supabase usando uma **função RPC** que é chamada pelo código do cliente.

### Passo 1: Execute a Migration Corrigida

1. Abra o **SQL Editor** no Supabase Dashboard
2. Execute o arquivo: `supabase_migration_trigger_fixed.sql`
3. A migration criará:
   - Tabelas `profiles` e `onboarding_progress`
   - Função `handle_new_user()` que pode ser chamada via RPC
   - Políticas RLS adequadas
   - Índices para performance

### Passo 2: O Código Já Está Atualizado

O arquivo `components/onboarding/OnboardingWizard.tsx` já foi atualizado para:
- Chamar a função RPC `handle_new_user()` após signup bem-sucedido
- Atualizar `level_id` e `quiz_score` após criar o perfil
- Ter fallback caso a função RPC falhe

### Como Funciona

1. **Usuário se registra** → `supabase.auth.signUp()` cria o usuário em `auth.users`
2. **Código chama função RPC** → `supabase.rpc('handle_new_user', {...})` cria o perfil
3. **Perfil é atualizado** → Com `level_id` e `quiz_score` do quiz

### Vantagens desta Abordagem

✅ Funciona sem permissões de superuser  
✅ Mais controle sobre quando criar o perfil  
✅ Pode incluir dados do quiz diretamente  
✅ Fácil de debugar e testar  
✅ Compatível com todas as versões do Supabase  

### Alternativa: Database Webhooks (Avançado)

Se você realmente precisa de um trigger automático, pode usar **Database Webhooks** do Supabase:
1. Vá em Database → Webhooks
2. Configure um webhook que escuta eventos de `auth.users`
3. O webhook chama uma Edge Function que cria o perfil

Mas a abordagem RPC é mais simples e recomendada.

## Testando

Após executar a migration:

1. Registre um novo usuário pelo onboarding
2. Verifique no Supabase se o perfil foi criado:
   ```sql
   SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 1;
   ```
3. Verifique se o onboarding_progress foi criado:
   ```sql
   SELECT * FROM public.onboarding_progress ORDER BY created_at DESC LIMIT 1;
   ```

## Troubleshooting

### Erro: "function handle_new_user does not exist"
- Certifique-se de executar a migration `supabase_migration_trigger_fixed.sql` completa

### Erro: "permission denied for table profiles"
- Verifique se as políticas RLS estão criadas corretamente
- Certifique-se de que o usuário está autenticado ao chamar a função

### Perfil não é criado
- Verifique os logs do console do navegador
- Verifique se `supabase.rpc()` está sendo chamado corretamente
- O código tem fallback para criar o perfil diretamente se a RPC falhar

