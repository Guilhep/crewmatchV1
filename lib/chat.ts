import { supabase } from './supabase-client';
import { Conversation, Message } from '../types/messages';

// Tipos para o banco de dados
interface ConversationRow {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  user1?: {
    id: string;
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
  user2?: {
    id: string;
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count?: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender?: {
    id: string;
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Obtém ou cria uma conversa entre dois usuários
 */
export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    // Garantir que user1_id < user2_id
    const [user1, user2] = [currentUserId, otherUserId].sort();

    // Verificar se já existe conversa
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user1_id', user1)
      .eq('user2_id', user2)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 = não encontrado, o que é esperado
      throw findError;
    }

    if (existing) {
      return { success: true, conversationId: existing.id };
    }

    // Criar nova conversa
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: user1,
        user2_id: user2,
      })
      .select('id')
      .single();

    if (createError) throw createError;

    return { success: true, conversationId: newConversation.id };
  } catch (error: any) {
    console.error('Erro ao obter/criar conversa:', error);
    return { success: false, error: error.message || 'Erro ao criar conversa' };
  }
}

/**
 * Busca todas as conversas do usuário atual
 */
export async function fetchConversations(
  currentUserId: string
): Promise<{ success: boolean; conversations?: Conversation[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        user1_id,
        user2_id,
        created_at,
        updated_at,
        user1:profiles!conversations_user1_id_fkey(id, name, full_name, avatar_url),
        user2:profiles!conversations_user2_id_fkey(id, name, full_name, avatar_url)
      `)
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, conversations: [] };
    }

    // Buscar todas as últimas mensagens de uma vez usando uma query agregada
    const conversationIds = data.map((conv) => conv.id);
    
    // Buscar última mensagem de cada conversa
    const { data: lastMessages } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, sender_id')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    // Agrupar por conversation_id e pegar a primeira (mais recente) de cada
    const lastMessagesMap = new Map<string, { content: string; created_at: string; sender_id: string }>();
    if (lastMessages) {
      for (const msg of lastMessages) {
        if (!lastMessagesMap.has(msg.conversation_id)) {
          lastMessagesMap.set(msg.conversation_id, msg);
        }
      }
    }

    // Contar mensagens não lidas para todas as conversas de uma vez
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('conversation_id, sender_id')
      .in('conversation_id', conversationIds)
      .is('read_at', null);

    // Agrupar contagens de não lidas por conversa e sender
    const unreadCountsMap = new Map<string, number>();
    if (unreadMessages) {
      for (const msg of unreadMessages) {
        const conv = data.find((c) => c.id === msg.conversation_id);
        if (conv) {
          const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
          if (msg.sender_id === otherUserId) {
            const key = msg.conversation_id;
            unreadCountsMap.set(key, (unreadCountsMap.get(key) || 0) + 1);
          }
        }
      }
    }

    // Montar conversas com os dados agregados
    const conversationsWithDetails = data.map((conv: ConversationRow) => {
      const otherUser = conv.user1_id === currentUserId ? conv.user2 : conv.user1;
      const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
      const lastMessage = lastMessagesMap.get(conv.id);
      const unreadCount = unreadCountsMap.get(conv.id) || 0;

      const participantName = otherUser?.full_name || otherUser?.name || 'Usuário';
      const participantAvatar =
        otherUser?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&background=1a1a1a&color=C6A663`;

      return {
        id: conv.id,
        participantId: otherUserId,
        participantName,
        participantAvatar,
        lastMessage: lastMessage?.content || '',
        lastMessageTime: lastMessage ? new Date(lastMessage.created_at) : new Date(conv.updated_at),
        unreadCount,
        isOnline: false, // TODO: Implementar status online
        isMatch: false,
      } as Conversation;
    });

    return { success: true, conversations: conversationsWithDetails };
  } catch (error: any) {
    console.error('Erro ao buscar conversas:', error);
    return { success: false, error: error.message || 'Erro ao buscar conversas' };
  }
}

/**
 * Busca mensagens de uma conversa
 */
export async function fetchMessages(
  conversationId: string,
  currentUserId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ success: boolean; messages?: Message[]; error?: string }> {
  try {
    // Verificar se o usuário tem acesso à conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    if (conversation.user1_id !== currentUserId && conversation.user2_id !== currentUserId) {
      throw new Error('Acesso negado a esta conversa');
    }

    // Buscar mensagens
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        read_at,
        created_at,
        sender:profiles!messages_sender_id_fkey(id, name, full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const otherUserId = conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id;

    const messages: Message[] = (data || []).map((msg: MessageRow) => ({
      id: msg.id,
      text: msg.content,
      senderId: msg.sender_id,
      receiverId: msg.sender_id === currentUserId ? otherUserId : currentUserId,
      timestamp: new Date(msg.created_at),
      read: !!msg.read_at,
      type: 'text' as const,
    }));

    return { success: true, messages };
  } catch (error: any) {
    console.error('Erro ao buscar mensagens:', error);
    return { success: false, error: error.message || 'Erro ao buscar mensagens' };
  }
}

/**
 * Envia uma mensagem
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<{ success: boolean; message?: Message; error?: string }> {
  try {
    // Verificar se o usuário tem acesso à conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    if (conversation.user1_id !== senderId && conversation.user2_id !== senderId) {
      throw new Error('Acesso negado a esta conversa');
    }

    // Inserir mensagem
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        read_at,
        created_at
      `)
      .single();

    if (insertError) throw insertError;

    const receiverId = conversation.user1_id === senderId ? conversation.user2_id : conversation.user1_id;

    const message: Message = {
      id: newMessage.id,
      text: newMessage.content,
      senderId: newMessage.sender_id,
      receiverId,
      timestamp: new Date(newMessage.created_at),
      read: false,
      type: 'text',
    };

    return { success: true, message };
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    return { success: false, error: error.message || 'Erro ao enviar mensagem' };
  }
}

/**
 * Marca mensagens como lidas
 */
export async function markMessagesAsRead(
  conversationId: string,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se o usuário tem acesso à conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    if (conversation.user1_id !== currentUserId && conversation.user2_id !== currentUserId) {
      throw new Error('Acesso negado a esta conversa');
    }

    const otherUserId = conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id;

    // Marcar mensagens do outro usuário como lidas
    const { error: updateError } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('sender_id', otherUserId)
      .is('read_at', null);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    return { success: false, error: error.message || 'Erro ao marcar mensagens como lidas' };
  }
}

/**
 * Configura subscription Realtime para mensagens de uma conversa
 */
export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (message: Message) => void,
  onMessageUpdated: (message: Message) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const newMessage = payload.new as MessageRow;
        
        // Buscar dados do sender
        const { data: sender } = await supabase
          .from('profiles')
          .select('id, name, full_name, avatar_url')
          .eq('id', newMessage.sender_id)
          .single();

        // Buscar dados da conversa para determinar receiver
        const { data: conversation } = await supabase
          .from('conversations')
          .select('user1_id, user2_id')
          .eq('id', conversationId)
          .single();

        if (conversation) {
          const receiverId = conversation.user1_id === newMessage.sender_id 
            ? conversation.user2_id 
            : conversation.user1_id;

          const message: Message = {
            id: newMessage.id,
            text: newMessage.content,
            senderId: newMessage.sender_id,
            receiverId,
            timestamp: new Date(newMessage.created_at),
            read: !!newMessage.read_at,
            type: 'text',
          };

          onNewMessage(message);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const updatedMessage = payload.new as MessageRow;
        
        // Buscar dados da conversa
        const { data: conversation } = await supabase
          .from('conversations')
          .select('user1_id, user2_id')
          .eq('id', conversationId)
          .single();

        if (conversation) {
          const receiverId = conversation.user1_id === updatedMessage.sender_id 
            ? conversation.user2_id 
            : conversation.user1_id;

          const message: Message = {
            id: updatedMessage.id,
            text: updatedMessage.content,
            senderId: updatedMessage.sender_id,
            receiverId,
            timestamp: new Date(updatedMessage.created_at),
            read: !!updatedMessage.read_at,
            type: 'text',
          };

          onMessageUpdated(message);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Configura subscription Realtime para lista de conversas
 * Nota: Esta função apenas notifica sobre mudanças. A atualização completa da lista
 * deve ser feita chamando fetchConversations novamente quando necessário.
 */
export function subscribeToConversations(
  currentUserId: string,
  onConversationUpdated: () => void,
  onNewConversation: () => void
) {
  const channel = supabase
    .channel(`conversations:${currentUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `user1_id=eq.${currentUserId}`,
      },
      () => {
        onConversationUpdated();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `user2_id=eq.${currentUserId}`,
      },
      () => {
        onConversationUpdated();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `user1_id=eq.${currentUserId}`,
      },
      () => {
        onNewConversation();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `user2_id=eq.${currentUserId}`,
      },
      () => {
        onNewConversation();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
