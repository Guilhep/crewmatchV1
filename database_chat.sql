-- =====================================================
-- SCHEMA CHAT 1:1 - CREW MATCH
-- Tabelas para sistema de conversas e mensagens
-- =====================================================

-- 1. Tabela de Conversas (1:1)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Constraint único: uma conversa por par de usuários
  UNIQUE(user1_id, user2_id),
  -- Constraint: user1_id deve ser menor que user2_id para evitar duplicatas
  CHECK (user1_id < user2_id)
);

-- 2. Tabela de Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Constraint: sender deve ser um dos participantes da conversa
  CONSTRAINT sender_must_be_participant CHECK (
    sender_id IN (
      SELECT user1_id FROM public.conversations WHERE id = conversation_id
      UNION
      SELECT user2_id FROM public.conversations WHERE id = conversation_id
    )
  )
);

-- 3. Habilitar RLS em todas as tabelas
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para CONVERSATIONS
-- Leitura: Usuários podem ver apenas conversas onde são participantes
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Criação: Usuários autenticados podem criar conversas
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Atualização: Usuários podem atualizar apenas suas próprias conversas
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations"
  ON public.conversations
  FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 5. Políticas RLS para MESSAGES
-- Leitura: Usuários podem ver mensagens apenas de conversas onde participam
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON public.messages;
CREATE POLICY "Users can view messages from own conversations"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- Criação: Usuários podem enviar mensagens apenas em conversas onde participam
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON public.messages;
CREATE POLICY "Users can send messages in own conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- Atualização: Usuários podem atualizar apenas suas próprias mensagens (para marcar como lida)
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
  ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at) WHERE read_at IS NULL;

-- 7. Trigger para atualizar updated_at em conversas quando nova mensagem é criada
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_new_message ON public.messages;
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

-- 8. Trigger para atualizar updated_at em conversas
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Função helper para obter ou criar conversa entre dois usuários
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user1_id UUID, p_user2_id UUID)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_user1 UUID;
  v_user2 UUID;
BEGIN
  -- Garantir que user1_id < user2_id para consistência
  IF p_user1_id < p_user2_id THEN
    v_user1 := p_user1_id;
    v_user2 := p_user2_id;
  ELSE
    v_user1 := p_user2_id;
    v_user2 := p_user1_id;
  END IF;

  -- Tentar encontrar conversa existente
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE user1_id = v_user1 AND user2_id = v_user2;

  -- Se não existir, criar nova conversa
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (user1_id, user2_id)
    VALUES (v_user1, v_user2)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
