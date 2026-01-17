# Sistema de Login Dual - Profissionais e Empresas

## Visão Geral

A aplicação CrewMatch agora suporta dois tipos de usuários com experiências completamente diferentes:

### 1. **Profissionais** (Freelancers/Autônomos)
- Passam por processo de onboarding com quiz de avaliação
- Recebem nível baseado no desempenho (Bronze, Silver, Trainee)
- Visualizam vagas disponíveis no formato de matching (swipe)
- Podem dar match em vagas de interesse

### 2. **Empresas Produtoras**
- Processo de cadastro simplificado (sem quiz)
- Fornecem CNPJ e nome da empresa
- Criam vagas para profissionais
- Visualizam candidatos interessados nas vagas

---

## Arquivos Criados/Modificados

### Novos Arquivos

#### 1. [`views/CompanyDashboard.tsx`](views/CompanyDashboard.tsx)
Dashboard exclusivo para empresas produtoras com:
- Botão destacado para criar novas vagas
- Estatísticas de vagas ativas e candidatos
- Lista de vagas recentes
- Mensagens de candidatos interessados

### Arquivos Modificados

#### 1. [`App.tsx`](App.tsx:1)
- Importado [`CompanyDashboard`](views/CompanyDashboard.tsx:1)
- Adicionado detecção de tipo de conta via [`profile.account_type`](hooks/useAuth.ts:19)
- Renderização condicional do dashboard baseado no tipo de usuário:
  - Empresas → [`CompanyDashboard`](views/CompanyDashboard.tsx:1)
  - Profissionais → [`Dashboard`](views/Dashboard.tsx:1)

#### 2. [`components/MobileNav.tsx`](components/MobileNav.tsx:1)
- Adicionado prop [`isCompany`](components/MobileNav.tsx:13) para override manual
- Botão central flutuante muda baseado no tipo:
  - Profissionais: Ícone de câmera (Match)
  - Empresas: Ícone de maleta (Jobs)

#### 3. [`components/jobs/CreateJobModal.tsx`](components/jobs/CreateJobModal.tsx:1)
- Adicionado callback [`onSuccess`](components/jobs/CreateJobModal.tsx:8) como alternativa a `onJobCreated`
- Mantida compatibilidade com código existente

#### 4. [`components/onboarding/OnboardingWizard.tsx`](components/onboarding/OnboardingWizard.tsx:1)
**Já estava implementado:**
- Seleção de tipo de conta (profissional ou empresa)
- Fluxo diferenciado:
  - Profissionais: Dados pessoais → Quiz → Resultado
  - Empresas: Dados da empresa (CNPJ) → Criação direta

---

## Fluxo de Autenticação

### Profissionais

```
Landing → Cadastro → Seleção "Profissional" 
  → Dados Pessoais → Quiz (10 perguntas) 
  → Resultado (Nível atribuído) → Dashboard
```

**No Dashboard:**
- Ver vagas disponíveis (botão Match)
- Feed social
- Mensagens
- Perfil

### Empresas Produtoras

```
Landing → Cadastro → Seleção "Produtora" 
  → Dados da Empresa (Nome, CNPJ, Email, Senha) 
  → CompanyDashboard
```

**No CompanyDashboard:**
- Criar novas vagas (botão destacado)
- Ver estatísticas (vagas ativas, candidatos, matches)
- Gerenciar vagas existentes
- Mensagens com candidatos
- Feed social
- Perfil da empresa

---

## Estrutura do Banco de Dados

### Tabela `profiles`

```sql
- id (uuid)
- email (text)
- name (text)
- full_name (text)
- account_type ('professional' | 'company')  -- CAMPO CHAVE
- cnpj (text, nullable) -- Apenas para empresas
- company_name (text, nullable) -- Apenas para empresas
- level_id ('bronze' | 'silver' | 'trainee', nullable) -- Apenas para profissionais
- quiz_score (integer, nullable) -- Apenas para profissionais
- onboarding_completed (boolean)
```

---

## Diferenças Principais

| Aspecto | Profissional | Empresa |
|---------|-------------|---------|
| **Onboarding** | Quiz de 10 perguntas | Apenas dados cadastrais |
| **Dashboard** | [`Dashboard.tsx`](views/Dashboard.tsx:1) | [`CompanyDashboard.tsx`](views/CompanyDashboard.tsx:1) |
| **Ação Principal** | Ver vagas (Match) | Criar vagas |
| **Botão Central** | Câmera (Match) | Maleta (Jobs) |
| **Campos Únicos** | `level_id`, `quiz_score` | `cnpj`, `company_name` |

---

## Como Testar

### Criar Conta de Profissional

1. Acesse a landing page
2. Clique em "Cadastre-se"
3. Selecione "Sou Profissional"
4. Preencha dados pessoais
5. Complete o quiz (10 perguntas)
6. Veja seu nível atribuído
7. Acesse o dashboard de profissional

### Criar Conta de Empresa

1. Acesse a landing page
2. Clique em "Cadastre-se"
3. Selecione "Sou Produtora"
4. Preencha:
   - Nome do responsável
   - Nome da empresa
   - CNPJ
   - Email
   - Senha
5. Acesse diretamente o dashboard de empresa

---

## Próximos Passos Sugeridos

1. **Integração com Banco de Dados Real**
   - Conectar [`createJob`](lib/jobs.ts:1) com Supabase
   - Criar tabela `jobs` no banco
   - Implementar listagem de vagas reais

2. **Sistema de Matching**
   - Salvar matches no banco
   - Notificar empresas quando profissional der match
   - Permitir empresas verem perfis dos candidatos

3. **Mensagens**
   - Implementar chat real entre empresas e profissionais
   - Notificações de novas mensagens

4. **Perfil da Empresa**
   - Página de edição de perfil para empresas
   - Upload de logo
   - Descrição da empresa
   - Portfólio de trabalhos

5. **Analytics**
   - Dashboard com métricas para empresas
   - Visualizações de vagas
   - Taxa de conversão de matches

---

## Observações Técnicas

- O tipo de conta é detectado via [`profile.account_type`](hooks/useAuth.ts:19)
- A navegação é protegida por [`AuthGuard`](components/AuthGuard.tsx:1)
- O [`MobileNav`](components/MobileNav.tsx:1) se adapta automaticamente ao tipo de usuário
- O sistema é totalmente type-safe com TypeScript
- Build otimizado com Vite

---

## Suporte

Para dúvidas ou problemas, consulte:
- [`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md)
- [`ONBOARDING_SETUP.md`](ONBOARDING_SETUP.md)
- [`ROUTE_PROTECTION_GUIDE.md`](ROUTE_PROTECTION_GUIDE.md)
