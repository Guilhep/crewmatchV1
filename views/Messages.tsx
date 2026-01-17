import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileNav from '../components/MobileNav';
import ConversationList from '../components/messages/ConversationList';
import ChatWindow from '../components/messages/ChatWindow';
import { Conversation, Message } from '../types/messages';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import {
  fetchConversations,
  fetchMessages,
  sendMessage as sendMessageAPI,
  markMessagesAsRead,
  subscribeToMessages,
  subscribeToConversations,
  getOrCreateConversation,
} from '../lib/chat';

interface MessagesProps {
  onBack: () => void;
  onNavigateToHome: () => void;
  onNavigateToProfile: () => void;
  onNavigateToMatch: () => void;
  initialConversationId?: string;
  initialParticipantId?: string;
}

const Messages: React.FC<MessagesProps> = ({
  onBack,
  onNavigateToHome,
  onNavigateToProfile,
  onNavigateToMatch,
  initialConversationId,
  initialParticipantId,
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const unsubscribeConversationsRef = useRef<(() => void) | null>(null);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;
  const currentMessages = selectedConversationId ? (messages[selectedConversationId] || []) : [];

  // Carregar conversas iniciais
  useEffect(() => {
    if (!user?.id) return;

    const loadConversations = async () => {
      setLoading(true);
      const result = await fetchConversations(user.id);
      if (result.success && result.conversations) {
        setConversations(result.conversations);

        // Se há uma conversa inicial ou participante inicial, selecionar/criar
        if (initialParticipantId && user.id !== initialParticipantId) {
          const existingConv = result.conversations.find(
            (c) => c.participantId === initialParticipantId
          );
          if (existingConv) {
            setSelectedConversationId(existingConv.id);
          } else {
            // Criar nova conversa
            const convResult = await getOrCreateConversation(user.id, initialParticipantId);
            if (convResult.success && convResult.conversationId) {
              // Recarregar conversas para incluir a nova
              const updatedResult = await fetchConversations(user.id);
              if (updatedResult.success && updatedResult.conversations) {
                setConversations(updatedResult.conversations);
                setSelectedConversationId(convResult.conversationId);
              }
            }
          }
        } else if (initialConversationId) {
          setSelectedConversationId(initialConversationId);
        }
      }
      setLoading(false);
    };

    loadConversations();
  }, [user?.id, initialConversationId, initialParticipantId]);

  // Carregar mensagens quando uma conversa é selecionada
  useEffect(() => {
    if (!selectedConversationId || !user?.id) return;

    const loadMessages = async () => {
      const result = await fetchMessages(selectedConversationId, user.id);
      if (result.success && result.messages) {
        setMessages((prev) => ({
          ...prev,
          [selectedConversationId]: result.messages || [],
        }));

        // Marcar mensagens como lidas
        await markMessagesAsRead(selectedConversationId, user.id);
      }
    };

    loadMessages();

    // Limpar subscription anterior
    if (unsubscribeMessagesRef.current) {
      unsubscribeMessagesRef.current();
      unsubscribeMessagesRef.current = null;
    }

    // Configurar Realtime para novas mensagens
    const unsubscribe = subscribeToMessages(
      selectedConversationId,
      (newMessage) => {
        setMessages((prev) => {
          const existing = prev[selectedConversationId] || [];
          // Evitar duplicatas
          if (existing.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return {
            ...prev,
            [selectedConversationId]: [...existing, newMessage],
          };
        });

        // Marcar como lida se for do outro usuário
        if (newMessage.senderId !== user.id) {
          markMessagesAsRead(selectedConversationId, user.id);
        }

        // Atualizar última mensagem na lista de conversas
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversationId
              ? {
                  ...conv,
                  lastMessage: newMessage.text,
                  lastMessageTime: newMessage.timestamp,
                  unreadCount:
                    newMessage.senderId === user.id ? conv.unreadCount : conv.unreadCount + 1,
                }
              : conv
          )
        );
      },
      (updatedMessage) => {
        setMessages((prev) => {
          const existing = prev[selectedConversationId] || [];
          return {
            ...prev,
            [selectedConversationId]: existing.map((m) =>
              m.id === updatedMessage.id ? updatedMessage : m
            ),
          };
        });
      }
    );

    unsubscribeMessagesRef.current = unsubscribe;

    return () => {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
        unsubscribeMessagesRef.current = null;
      }
    };
  }, [selectedConversationId, user?.id]);

  // Configurar Realtime para atualizações de conversas
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToConversations(
      user.id,
      async () => {
        // Recarregar conversas quando há atualização
        const result = await fetchConversations(user.id);
        if (result.success && result.conversations) {
          setConversations(result.conversations);
        }
      },
      async () => {
        // Recarregar conversas quando há nova conversa
        const result = await fetchConversations(user.id);
        if (result.success && result.conversations) {
          setConversations(result.conversations);
        }
      }
    );

    unsubscribeConversationsRef.current = unsubscribe;

    return () => {
      if (unsubscribeConversationsRef.current) {
        unsubscribeConversationsRef.current();
        unsubscribeConversationsRef.current = null;
      }
    };
  }, [user?.id]);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (isMobile) {
      setShowChatOnMobile(true);
    }

    // Marcar mensagens como lidas
    if (user?.id) {
      await markMessagesAsRead(conversationId, user.id);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedConversationId || !user?.id || sendingMessage || !text.trim()) return;

    setSendingMessage(true);

    // Otimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      text: text.trim(),
      senderId: user.id,
      receiverId: selectedConversation?.participantId || '',
      timestamp: new Date(),
      read: false,
      type: 'text',
    };

    setMessages((prev) => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), tempMessage],
    }));

    // Atualizar última mensagem na lista de conversas
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversationId
          ? {
              ...conv,
              lastMessage: text.trim(),
              lastMessageTime: new Date(),
            }
          : conv
      )
    );

    // Enviar mensagem para o servidor
    const result = await sendMessageAPI(selectedConversationId, user.id, text.trim());

    if (result.success && result.message) {
      // Substituir mensagem temporária pela real
      setMessages((prev) => {
        const existing = prev[selectedConversationId] || [];
        return {
          ...prev,
          [selectedConversationId]: existing
            .filter((m) => !m.id.startsWith('temp-'))
            .concat(result.message!),
        };
      });
    } else {
      // Remover mensagem temporária em caso de erro
      setMessages((prev) => {
        const existing = prev[selectedConversationId] || [];
        return {
          ...prev,
          [selectedConversationId]: existing.filter((m) => !m.id.startsWith('temp-')),
        };
      });
      alert(result.error || 'Erro ao enviar mensagem');
    }

    setSendingMessage(false);
  };

  const handleBackToList = () => {
    setShowChatOnMobile(false);
    // Opcional: limpar seleção ao voltar (comentado para manter estado)
    // setSelectedConversationId(null);
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0B0E17]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#8A8F9A]">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-[#0B0E17] overflow-hidden",
      showChatOnMobile && isMobile ? "h-screen fixed inset-0" : "h-screen"
    )}>
      {/* Container Principal */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop: Layout Split */}
        <div className="hidden md:flex w-full h-full">
          {/* Painel Esquerdo - Lista de Conversas */}
          <div className="w-[380px] flex-shrink-0 border-r border-[#1A1F2D]">
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              onBack={onBack}
              showBackButton={true}
            />
          </div>

          {/* Painel Direito - Chat com cantos arredondados no topo */}
          <div className="flex-1 min-w-0 overflow-hidden">
                <ChatWindow
                  conversation={selectedConversation}
                  messages={currentMessages}
                  currentUserId={user?.id || ''}
                  onSendMessage={handleSendMessage}
                />
          </div>
        </div>

        {/* Mobile: Layout Alternado */}
        <div className={cn(
          "md:hidden w-full relative",
          showChatOnMobile ? "h-screen" : "h-full"
        )}>
          <AnimatePresence mode="wait">
            {!showChatOnMobile ? (
              // Lista de Conversas
              <motion.div
                key="conversation-list"
                initial={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 w-full h-full"
              >
                <ConversationList
                  conversations={conversations}
                  selectedConversationId={selectedConversationId}
                  onSelectConversation={handleSelectConversation}
                  onBack={onBack}
                  showBackButton={true}
                />
              </motion.div>
            ) : (
              // Chat Window - Ocupa tela inteira no mobile
              <motion.div
                key="chat-window"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 w-full h-screen"
              >
                <ChatWindow
                  conversation={selectedConversation}
                  messages={currentMessages}
                  currentUserId={user?.id || ''}
                  onSendMessage={handleSendMessage}
                  onBack={handleBackToList}
                  showBackButton={true}
                  isMobile={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Navigation - Esconder quando chat está aberto */}
      {!showChatOnMobile && (
        <div className="md:hidden">
          <MobileNav
            activeTab="chat"
            onHomeClick={onNavigateToHome}
            onFeedClick={() => {}}
            onChatClick={() => {}}
            onProfileClick={onNavigateToProfile}
            onMatchClick={onNavigateToMatch}
          />
        </div>
      )}
    </div>
  );
};

export default Messages;

