# Guia de Proteção de Rotas - CrewMatch

Este documento explica como a proteção de rotas está implementada no projeto.

## 📋 Estrutura

O projeto usa **React SPA com Vite** (não Next.js), então a proteção de rotas é feita via componentes React e hooks.

## 🔐 Sistema de Autenticação

### Cliente Supabase

O cliente Supabase está configurado em `lib/supabase-client.ts` com:
- ✅ Persistência de sessão via `localStorage`
- ✅ Auto-refresh de tokens
- ✅ Detecção de sessão na URL

### Hook useAuth

O hook `hooks/useAuth.ts` fornece:
- `user`: Objeto do usuário autenticado
- `session`: Sessão atual
- `profile`: Perfil do usuário do banco de dados
- `loading`: Estado de carregamento
- `error`: Erros de autenticação
- `refreshProfile()`: Atualizar perfil
- `signOut()`: Fazer logout

## 🛡️ Proteção de Rotas

### Componente AuthGuard

O componente `components/AuthGuard.tsx` protege rotas baseado no estado de autenticação:

```tsx
<AuthGuard
  requireAuth={true}  // true = requer autenticação, false = requer que NÃO esteja autenticado
  redirectTo={() => setCurrentView(View.LANDING)}
>
  <ProtectedComponent />
</AuthGuard>
```

### Rotas Protegidas

As seguintes rotas são protegidas (requerem autenticação):
- ✅ `/dashboard` (View.DASHBOARD)
- ✅ `/jobmatching` (View.MATCHING)
- ✅ `/messages` (View.MESSAGES)
- ✅ `/profile` (View.PROFILE_EDIT)
- ✅ `/createjob` (View.CREATE_JOB)

### Rotas Públicas

- ✅ `/` ou Landing (View.LANDING) - **NÃO** requer autenticação

## 🔄 Lógica de Redirecionamento

### Regras Implementadas:

1. **Usuário não autenticado tenta acessar rota protegida**
   - ❌ Acesso negado
   - ➡️ Redireciona para `View.LANDING`

2. **Usuário autenticado tenta acessar Landing/Login**
   - ✅ Já está autenticado
   - ➡️ Redireciona para `View.DASHBOARD`

3. **Verificação automática no App.tsx**
   - O `useEffect` no `App.tsx` verifica autenticação automaticamente
   - Redireciona conforme necessário antes de renderizar

## 📝 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Como obter as credenciais:**
1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings > API**
4. Copie a **Project URL** para `VITE_SUPABASE_URL`
5. Copie a **anon public** key para `VITE_SUPABASE_ANON_KEY`

## 🚀 Como Usar

### 1. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas credenciais do Supabase
```

### 2. A Proteção Funciona Automaticamente

O `App.tsx` já está configurado com `AuthGuard` em todas as rotas. Não é necessário fazer nada adicional.

### 3. Adicionar Nova Rota Protegida

```tsx
// No App.tsx, adicione ao enum View
enum View {
  // ... views existentes
  NEW_PROTECTED_VIEW,
}

// Adicione ao array de rotas protegidas
const protectedViews = [
  // ... views existentes
  View.NEW_PROTECTED_VIEW,
];

// No renderView(), envolva com AuthGuard
case View.NEW_PROTECTED_VIEW:
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo={() => setCurrentView(View.LANDING)}
    >
      <NewProtectedComponent />
    </AuthGuard>
  );
```

## 🔍 Verificação de Sessão

A sessão é verificada:
1. **No carregamento inicial** - `useAuth` verifica a sessão salva
2. **Em mudanças de estado** - `onAuthStateChange` escuta mudanças
3. **Antes de renderizar rotas** - `AuthGuard` verifica antes de renderizar

## ⚠️ Troubleshooting

### "Missing Supabase environment variables"
- Verifique se o arquivo `.env` existe na raiz
- Verifique se as variáveis começam com `VITE_`
- Reinicie o servidor de desenvolvimento após criar/editar `.env`

### Sessão não persiste após recarregar
- Verifique se o `localStorage` está habilitado no navegador
- Verifique se não há bloqueadores de cookies/localStorage

### Redirecionamento infinito
- Verifique se o `useEffect` no `App.tsx` não está causando loop
- Verifique se `loading` está sendo tratado corretamente

## 📚 Arquivos Relacionados

- `lib/supabase-client.ts` - Cliente Supabase
- `hooks/useAuth.ts` - Hook de autenticação
- `components/AuthGuard.tsx` - Componente de proteção
- `App.tsx` - Roteamento principal
- `.env` - Variáveis de ambiente (não versionado)
