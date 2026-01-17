# Setup do Banco de Dados - Sistema de Jobs

## Passo a Passo para Configurar as Tabelas de Jobs

### 1. Acessar o Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto CrewMatch

### 2. Executar o Script SQL

1. No painel do Supabase, vá em **SQL Editor** (ícone de banco de dados na barra lateral)
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo [`supabase_jobs_migration.sql`](supabase_jobs_migration.sql)
4. Cole no editor SQL
5. Clique em **Run** (ou pressione Ctrl+Enter)

**IMPORTANTE**: Use o arquivo `supabase_jobs_migration.sql` em vez do `supabase_jobs_setup.sql`. O arquivo de migração:
- ✅ Remove tabelas antigas se existirem
- ✅ Cria tabelas do zero com estrutura correta
- ✅ Evita conflitos de colunas
- ✅ Configura todas as políticas RLS

### 3. Verificar se as Tabelas foram Criadas

Execute o seguinte comando no SQL Editor para verificar:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('jobs', 'job_applications');
```

Você deve ver duas linhas:
- `jobs`
- `job_applications`

### 4. Verificar as Políticas RLS

Execute para ver as políticas criadas:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('jobs', 'job_applications');
```

## Estrutura das Tabelas

### Tabela `jobs`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único da vaga |
| `recruiter_id` | UUID | ID da empresa que criou a vaga |
| `title` | TEXT | Título da vaga |
| `description` | TEXT | Descrição detalhada |
| `budget` | DECIMAL | Orçamento (opcional) |
| `location` | TEXT | Localização (opcional) |
| `status` | TEXT | 'open' ou 'closed' |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de atualização |

### Tabela `job_applications`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único da aplicação |
| `job_id` | UUID | ID da vaga |
| `applicant_id` | UUID | ID do profissional |
| `status` | TEXT | 'pending', 'accepted', 'rejected', 'withdrawn' |
| `message` | TEXT | Mensagem do candidato (opcional) |
| `created_at` | TIMESTAMPTZ | Data da candidatura |
| `updated_at` | TIMESTAMPTZ | Data de atualização |

## Políticas de Segurança (RLS)

### Para a tabela `jobs`:

✅ **Visualização**: Qualquer usuário autenticado pode ver vagas abertas
✅ **Criação**: Apenas empresas podem criar vagas
✅ **Atualização**: Apenas a empresa dona pode atualizar
✅ **Exclusão**: Apenas a empresa dona pode deletar

### Para a tabela `job_applications`:

✅ **Visualização**: Profissionais veem suas aplicações, empresas veem aplicações de suas vagas
✅ **Criação**: Apenas profissionais podem se candidatar
✅ **Atualização**: Profissionais podem retirar candidatura, empresas podem atualizar status

## Testando o Sistema

### 1. Criar uma Vaga (como Empresa)

1. Faça login com uma conta de empresa
2. No dashboard, clique em **"Criar Nova Vaga"**
3. Preencha:
   - Título: "Diretor de Fotografia"
   - Descrição: "Procuramos DP experiente para comercial..."
   - Orçamento: 5000
   - Localização: "São Paulo, SP"
4. Clique em **"Criar Vaga"**

### 2. Ver Vagas Criadas

1. No dashboard da empresa, você verá:
   - Estatísticas atualizadas (vagas ativas, candidatos)
   - Lista de vagas recentes
2. Clique em **"Ver todas"** ou no ícone de maleta para ir para "Minhas Vagas"

### 3. Ver Detalhes e Candidatos

1. Na tela "Minhas Vagas", clique em uma vaga
2. Você verá:
   - Descrição completa
   - Lista de candidatos (se houver)
   - Botão para entrar em contato com cada candidato

### 4. Candidatar-se a uma Vaga (como Profissional)

1. Faça login com uma conta de profissional
2. Vá para a tela de Match (ícone de câmera)
3. Dê swipe para a direita em uma vaga de interesse
4. A candidatura será registrada automaticamente

## Funcionalidades Implementadas

### Para Empresas Produtoras:

✅ **Criar vagas** - Modal completo com validação
✅ **Ver estatísticas** - Vagas ativas, total de candidatos
✅ **Gerenciar vagas** - Listar, visualizar, deletar
✅ **Ver candidatos** - Lista de profissionais interessados
✅ **Entrar em contato** - Botão para iniciar conversa

### Para Profissionais:

✅ **Ver vagas disponíveis** - Sistema de swipe/match
✅ **Candidatar-se** - Swipe para a direita
✅ **Ver minhas candidaturas** - (a ser implementado)

## Troubleshooting

### Erro: "permission denied for table jobs"

**Solução**: Verifique se as políticas RLS foram criadas corretamente. Execute novamente a seção de políticas do script SQL.

### Erro: "column recruiter_id does not exist"

**Solução**: A tabela foi criada com nome de coluna diferente. Execute o script SQL completo novamente.

### Vagas não aparecem no dashboard

**Solução**: 
1. Verifique se você está logado como empresa
2. Verifique se criou alguma vaga
3. Abra o console do navegador (F12) e veja se há erros

### Não consigo criar vaga

**Solução**:
1. Verifique se sua conta tem `account_type = 'company'` no banco
2. Execute no SQL Editor:
```sql
SELECT id, email, account_type FROM profiles WHERE id = auth.uid();
```

## Próximos Passos

1. ✅ Implementar sistema de notificações quando profissional se candidata
2. ✅ Adicionar filtros de busca de vagas
3. ✅ Implementar sistema de favoritos
4. ✅ Adicionar analytics para empresas
5. ✅ Implementar sistema de avaliações

## Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do Supabase (aba Logs no painel)
3. Consulte a documentação do Supabase sobre RLS
