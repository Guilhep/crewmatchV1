# Configuração do Fluxo de Onboarding

## Visão Geral

O fluxo de onboarding foi implementado com 3 etapas:

1. **Step 1: Account Details** - Coleta nome, email e senha do usuário
2. **Step 2: Skill Validation Quiz** - 8 perguntas técnicas sobre audiovisual
3. **Step 3: Result & Level Assignment** - Calcula score e atribui nível (Silver/Bronze/Trainee)

## Configuração do Supabase

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 2. Estrutura da Tabela `profiles`

No Supabase, crie uma tabela `profiles` com a seguinte estrutura:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  level_id TEXT CHECK (level_id IN ('silver', 'bronze', 'trainee')),
  quiz_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários lerem seu próprio perfil
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política para usuários criarem seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 3. Lógica de Níveis

- **Score 7-8**: Nível **Silver (Prata)** - Pode receber matches
- **Score 4-6**: Nível **Bronze** - Pode receber matches
- **Score < 4**: Nível **Trainee/Pending** - Não pode receber matches ainda

## Como Usar

1. Na página inicial (Landing), clique no botão **"Sou Profissional"**
2. Preencha seus dados (nome, email, senha)
3. Responda as 8 perguntas técnicas do quiz
4. Veja seu resultado e nível atribuído
5. Acesse o dashboard após completar

## Estrutura de Arquivos

```
components/onboarding/
  ├── AccountDetailsStep.tsx    # Step 1: Formulário de cadastro
  ├── QuizStep.tsx              # Step 2: Quiz de validação
  ├── ResultStep.tsx            # Step 3: Resultado e nível
  └── OnboardingWizard.tsx      # Componente principal que orquestra os steps

constants/
  └── onboardingQuestions.ts    # Array com as 8 perguntas e lógica de cálculo

lib/
  └── supabase.ts               # Cliente Supabase configurado
```

## Perguntas do Quiz

As perguntas cobrem:
- Technical Physics (180-degree shutter rule)
- Exposure (ISO e ruído)
- Lighting (Temperatura de cor, Key Light)
- Post-Production (LOG profiles, Codecs)
- Audio (Sample Rate)
- Optics (Abertura do diafragma)

## Próximos Passos

- [ ] Implementar autenticação social (Google, GitHub)
- [ ] Adicionar validação de email
- [ ] Criar página de re-teste para usuários Trainee
- [ ] Adicionar analytics do quiz
- [ ] Melhorar feedback visual durante o quiz

