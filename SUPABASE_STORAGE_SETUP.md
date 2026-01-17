# Configuração do Supabase Storage

Para que o upload de fotos de perfil, capa e portfólio funcione, você precisa configurar os buckets no Supabase Storage.

## Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/gefobrspvplbalkmsmkd
2. No menu lateral, clique em **Storage**

## Passo 2: Criar o Bucket "profiles"

1. Clique em **"New bucket"** ou **"Create a new bucket"**
2. Preencha os campos:
   - **Name**: `profiles`
   - **Public bucket**: ✅ **MARQUE ESTA OPÇÃO** (importante!)
   - **File size limit**: 5 MB (ou conforme sua preferência)
   - **Allowed MIME types**: `image/*` (permite todas as imagens)
3. Clique em **"Create bucket"**

## Passo 3: Configurar Políticas de Acesso (RLS)

Após criar o bucket, você precisa configurar as políticas de acesso:

### 3.1. Política de Leitura (SELECT)
```sql
-- Permitir que todos vejam as imagens
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profiles' );
```

### 3.2. Política de Upload (INSERT)
```sql
-- Permitir que usuários autenticados façam upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);
```

### 3.3. Política de Atualização (UPDATE)
```sql
-- Permitir que usuários atualizem suas próprias imagens
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3.4. Política de Exclusão (DELETE)
```sql
-- Permitir que usuários deletem suas próprias imagens
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Passo 4: Aplicar as Políticas

1. No Supabase Dashboard, vá em **Storage** > **Policies**
2. Selecione o bucket **profiles**
3. Clique em **"New Policy"**
4. Cole cada uma das políticas SQL acima
5. Clique em **"Review"** e depois **"Save policy"**

## Passo 5: Verificar Configuração

Para verificar se está tudo certo:

1. Vá em **Storage** > **profiles**
2. Você deve ver:
   - ✅ Bucket público
   - ✅ 4 políticas ativas (SELECT, INSERT, UPDATE, DELETE)

## Estrutura de Pastas

O código cria automaticamente as seguintes pastas dentro do bucket `profiles`:

```
profiles/
├── avatars/
│   └── {user_id}/
│       └── avatar.{ext}
├── covers/
│   └── {user_id}/
│       └── cover.{ext}
└── portfolio/
    └── {user_id}/
        ├── portfolio-0.{ext}
        ├── portfolio-1.{ext}
        └── portfolio-2.{ext}
```

## Solução de Problemas

### Erro: "new row violates row-level security policy"
- **Causa**: Políticas RLS não configuradas
- **Solução**: Execute as políticas SQL do Passo 3

### Erro: "Bucket not found"
- **Causa**: Bucket não foi criado
- **Solução**: Crie o bucket conforme Passo 2

### Erro: "File size exceeds limit"
- **Causa**: Arquivo muito grande
- **Solução**: Aumente o limite no bucket ou reduza o tamanho da imagem

### Imagens não aparecem
- **Causa**: Bucket não está público
- **Solução**: Marque a opção "Public bucket" nas configurações do bucket

## Testando

Após configurar:

1. Faça login na aplicação
2. Vá para o perfil
3. Clique no ícone de câmera no avatar ou capa
4. Selecione uma imagem
5. A imagem deve ser enviada e aparecer imediatamente

Se houver erro, verifique o console do navegador (F12) para mais detalhes.
