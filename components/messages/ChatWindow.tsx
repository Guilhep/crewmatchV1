import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, Phone, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Conversation, Message } from '../../types/messages';
import MessageBubble from './MessageBubble';
import MessageInputBar from './MessageInputBar';
import VoiceCallModal from './VoiceCallModal';
import { useVoiceCall } from '../../hooks/useVoiceCall';
import { cn } from '../../lib/utils';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  isMobile?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  showBackButton = false,
  isMobile = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showCallModal, setShowCallModal] = useState(false);

  // Hook de chamada de voz - sempre chamar, mas com valores padrão se não houver conversa
  const {
    callStatus,
    isMuted,
    callDuration,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  } = useVoiceCall(
    conversation?.id || '',
    currentUserId || '',
    conversation?.participantId || ''
  );

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mostrar modal quando houver chamada
  useEffect(() => {
    if (callStatus !== 'idle') {
      setShowCallModal(true);
    } else {
      setShowCallModal(false);
    }
  }, [callStatus]);

  // Iniciar chamada de voz
  const handleStartVoiceCall = async () => {
    console.log('📞 Botão de chamada clicado');
    console.log('📊 Dados da conversa:', {
      conversationId: conversation?.id,
      currentUserId,
      participantId: conversation?.participantId,
    });
    
    if (!conversation) {
      console.error('❌ Nenhuma conversa selecionada');
      alert('Selecione uma conversa primeiro');
      return;
    }
    
    console.log('📞 Iniciando chamada de voz...');
    try {
      await startCall();
      console.log('✅ Chamada iniciada');
    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error);
      alert('Erro ao iniciar chamada. Verifique as permissões do microfone.');
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0E17]">
        <div className="text-center p-8">
          <p className="text-[#8A8F9A] text-sm">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-[#111522]",
      isMobile ? "h-[100dvh] rounded-none" : "h-full rounded-t-3xl overflow-hidden"
    )}
    style={isMobile ? {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
    } : undefined}
    >
      {/* Header do Chat - Background ligeiramente mais claro */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#141824] border-b border-[#1A1F2D] flex-shrink-0" style={{ WebkitBackfaceVisibility: 'hidden' }}>
        {/* Back Button - Apenas no mobile */}
        {isMobile && showBackButton && onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-[#D4AF37] hover:text-[#C6A663] transition-colors flex-shrink-0"
            aria-label="Voltar para lista de conversas"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        
        {/* Avatar - Circular */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img
              src={conversation.participantAvatar}
              alt={conversation.participantName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Nome e Status "Online" */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-white text-[15px] leading-tight truncate">
            {conversation.participantName}
          </h2>
          <p className={cn(
            'text-[12px] leading-tight',
            conversation.isOnline ? 'text-[#4CAF50]' : 'text-[#8A8F9A]'
          )}>
            {conversation.isOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        {/* Call and Video Icons - Alinhados à direita */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleStartVoiceCall}
            className="p-2 text-[#8A8F9A] hover:text-[#D4AF37] transition-colors"
            aria-label="Ligar"
            title="Chamada de voz"
          >
            <Phone size={20} />
          </button>
          <button
            className="p-2 text-[#8A8F9A] hover:text-[#D4AF37] transition-colors opacity-50 cursor-not-allowed"
            aria-label="Vídeo chamada"
            title="Em breve"
            disabled
          >
            <Video size={20} />
          </button>
        </div>
      </div>

      {/* Área de Mensagens - Scrollable */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 bg-[#0B0E17]"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={message.senderId === currentUserId}
              senderName={message.senderId === currentUserId ? undefined : conversation.participantName}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar - Fixo no bottom */}
      <div 
        className={cn(
          "flex-shrink-0 bg-[#111522] border-t border-[#1A1F2D]",
          isMobile && "pb-safe"
        )}
        style={{
          position: isMobile ? 'sticky' : 'relative',
          bottom: 0,
          zIndex: 1001,
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <MessageInputBar onSendMessage={onSendMessage} />
      </div>

      {/* Voice Call Modal */}
      {conversation && (
        <VoiceCallModal
          isOpen={showCallModal}
          callStatus={callStatus}
          participantName={conversation.participantName}
          participantAvatar={conversation.participantAvatar}
          isMuted={isMuted}
          callDuration={callDuration}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
          onToggleMute={toggleMute}
        />
      )}
    </div>
  );
};

export default ChatWindow;
