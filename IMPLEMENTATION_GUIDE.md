# Guia de Implementação - Funcionalidades Core

Este documento descreve as três funcionalidades implementadas e como utilizá-las.

## 📋 Índice

1. [Autenticação e Rotas Protegidas](#1-autenticação-e-rotas-protegidas)
2. [Perfil de Usuário (Read/Write)](#2-perfil-de-usuário-readwrite)
3. [Lógica de Produtor e Criação de Jobs](#3-lógica-de-produtor-e-criação-de-jobs)

---

## 1. Autenticação e Rotas Protegidas

### Schema do Banco de Dados

Execute o arquivo `database_schema_extended.sql` no SQL Editor do Supabase para:
- Estender a tabela `profiles` com `cover_url` e `portfolio_url`
- Criar a tabela `jobs` com todas as políticas RLS
- Criar índices para performance

### Componente ProtectedRoute

O componente `components/ProtectedRoute.tsx` protege rotas que requerem autenticação.

**Uso:**

```tsx
import ProtectedRoute from './components/ProtectedRoute';

// Proteger rota qualquer
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>

// Proteger rota com role específico
<ProtectedRoute requiredRole="company">
  <CreateJobPage />
</ProtectedRoute>
```

**Nota:** Como o projeto usa Vite (não Next.js Router), você precisará adaptar o `ProtectedRoute` para usar o sistema de roteamento atual (estado do App.tsx) ou implementar React Router.

### Configuração do Storage

No Supabase Dashboard > Storage, crie os seguintes buckets:

1. **`avatars`** (público)
   - Política: `SELECT` e `INSERT` para usuários autenticados
   - Política: `SELECT` público para leitura

2. **`covers`** (público)
   - Mesmas políticas do `avatars`

3. **`job-images`** (público)
   - Política: `SELECT` público
   - Política: `INSERT` apenas para usuários com role `company`

---

## 2. Perfil de Usuário (Read/Write)

### Estrutura de Dados

O perfil estendido inclui:
- `avatar_url` (string) - URL da imagem de avatar
- `cover_url` (string) - URL da imagem de capa
- `bio` (text) - Biografia do usuário
- `portfolio_url` (string) - Link para portfólio externo

### Componente ProfileEditForm

O componente `components/profile/ProfileEditForm.tsx` fornece uma interface completa para edição de perfil.

**Uso:**

```tsx
import ProfileEditForm from './components/profile/ProfileEditForm';

<ProfileEditForm
  onSave={() => {
    console.log('Perfil salvo!');
    // Atualizar UI ou redirecionar
  }}
  onCancel={() => {
    // Cancelar edição
  }}
/>
```

### Funções de Upload

As funções em `lib/storage.ts` e `lib/profile.ts` gerenciam uploads:

```tsx
import { updateAvatar, updateCover, updateProfile } from './lib/profile';

// Upload de avatar
const result = await updateAvatar(userId, file);
if (result.success) {
  console.log('Avatar atualizado:', result.url);
}

// Upload de cover
const result = await updateCover(userId, file);
if (result.success) {
  console.log('Cover atualizado:', result.url);
}

// Atualizar outros campos
const result = await updateProfile(userId, {
  full_name: 'Novo Nome',
  bio: 'Nova biografia',
  portfolio_url: 'https://portfolio.com',
});
```

---

## 3. Lógica de Produtor e Criação de Jobs

### Verificação de Role

A função `isProducer()` verifica se o usuário tem role `company`:

```tsx
import { isProducer } from './lib/jobs';

const producer = await isProducer(userId);
if (producer) {
  // Usuário é produtor
}
```

### Componente CreateJobForm

O componente `components/jobs/CreateJobForm.tsx` permite criar jobs (apenas para produtores).

**Uso:**

```tsx
import CreateJobForm from './components/jobs/CreateJobForm';

<CreateJobForm
  onSuccess={() => {
    console.log('Job criado com sucesso!');
    // Redirecionar ou atualizar lista
  }}
  onCancel={() => {
    // Cancelar criação
  }}
/>
```

### Página CreateJob

A página `views/CreateJob.tsx` já inclui verificação de autorização e mostra mensagem de "Acesso Negado" se o usuário não for produtor.

### Funções de Jobs

As funções em `lib/jobs.ts` gerenciam jobs:

```tsx
import { createJob, getUserJobs, getActiveJobs, updateJob, deleteJob } from './lib/jobs';

// Criar job
const result = await createJob(userId, {
  title: 'Diretor de Fotografia',
  description: 'Projeto comercial...',
  budget: 'R$ 10.000',
  location: 'São Paulo, SP',
  dates: '15-20 Jan 2024',
  requirements: ['Experiência com câmeras RED', 'Portfolio comercial'],
  tags: ['Fotografia', 'Comercial'],
}, imageFile);

// Buscar jobs do usuário
const jobs = await getUserJobs(userId);

// Buscar jobs ativos (para matching)
const activeJobs = await getActiveJobs(50);

// Atualizar job
const result = await updateJob(jobId, userId, {
  title: 'Novo título',
  status: 'closed',
});

// Deletar job
const result = await deleteJob(jobId, userId);
```

---

## 🔧 Integração com App.tsx

Para integrar as novas funcionalidades no sistema de roteamento atual:

```tsx
// Adicionar nova view
enum View {
  // ... views existentes
  CREATE_JOB,
  PROFILE_EDIT_EXTENDED,
}

// No renderView()
case View.CREATE_JOB:
  return (
    <ProtectedRoute requiredRole="company">
      <CreateJob
        onBack={() => setCurrentView(View.DASHBOARD)}
        onSuccess={() => {
          // Atualizar lista de jobs
        }}
      />
    </ProtectedRoute>
  );

case View.PROFILE_EDIT_EXTENDED:
  return (
    <ProtectedRoute>
      <ProfileEditForm
        onSave={() => setCurrentView(View.DASHBOARD)}
        onCancel={() => setCurrentView(View.DASHBOARD)}
      />
    </ProtectedRoute>
  );
```

---

## 📝 Próximos Passos

1. **Execute o SQL:** Rode `database_schema_extended.sql` no Supabase
2. **Configure Storage:** Crie os buckets no Supabase Dashboard
3. **Integre Componentes:** Adicione os componentes nas rotas apropriadas
4. **Teste Uploads:** Verifique se os uploads de imagem funcionam
5. **Teste Jobs:** Crie um usuário com role `company` e teste criação de jobs

---

## ⚠️ Notas Importantes

- O `ProtectedRoute` usa `react-router-dom` - você pode precisar adaptar para o sistema de roteamento atual
- Certifique-se de que as políticas RLS no Supabase estão configuradas corretamente
- Os buckets de storage devem ter políticas públicas para leitura (SELECT) mas protegidas para escrita (INSERT)
- A função `isProducer` verifica o role no banco - certifique-se de que o role está sendo salvo corretamente no registro

---

## 🐛 Troubleshooting

**Erro ao fazer upload:**
- Verifique se o bucket existe no Supabase Storage
- Verifique as políticas de acesso do bucket
- Verifique se o arquivo não excede o tamanho máximo (5MB para avatar, 10MB para cover/job-image)

**Erro ao criar job:**
- Verifique se o usuário tem role `company` na tabela `profiles`
- Verifique as políticas RLS da tabela `jobs`

**ProtectedRoute não funciona:**
- Adapte o componente para usar o sistema de roteamento atual (estado do App.tsx) ou implemente React Router
