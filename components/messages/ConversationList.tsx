import React, { useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Conversation } from '../../types/messages';
import ConversationItem from './ConversationItem';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onBack,
  showBackButton = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ordenar por última mensagem (mais recente primeiro)
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
  });

  return (
    <div className="flex flex-col h-full bg-[#111522] overflow-hidden">
      {/* Search Bar - Top */}
      <div className="px-4 pt-4 pb-3 bg-[#111522] flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Botão de Voltar */}
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="p-2 text-[#D4AF37] hover:text-[#C6A663] hover:bg-[#141824] rounded-lg transition-colors flex-shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          {/* Barra de Pesquisa */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar mensagens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#141824] border border-[#1A1F2D] rounded-lg text-white placeholder-[#8A8F9A] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]/50 transition-all"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8F9A] pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Lista de Conversas */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-[#8A8F9A] text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div>
            {sortedConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
