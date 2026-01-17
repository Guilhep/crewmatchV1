# Configuração de Variáveis de Ambiente

## 📝 Arquivo .env

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Supabase Configuration
# Obtenha essas credenciais no dashboard do Supabase: https://app.supabase.com
# Vá em Settings > API

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🔑 Como Obter as Credenciais

1. Acesse https://app.supabase.com
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Settings > API**
4. Copie a **Project URL** para `VITE_SUPABASE_URL`
5. Copie a **anon public** key para `VITE_SUPABASE_ANON_KEY`

## ⚠️ Importante

- O arquivo `.env` não deve ser versionado no Git (já está no .gitignore)
- As variáveis devem começar com `VITE_` para serem acessíveis no Vite
- Reinicie o servidor de desenvolvimento após criar/editar o `.env`

## ✅ Verificação

Após configurar, reinicie o servidor:

```bash
npm run dev
```

Se tudo estiver correto, você não verá avisos sobre variáveis de ambiente faltando.
