import React from 'react';
import { Conversation } from '../../types/messages';
import { cn } from '../../lib/utils';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
}) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-4 flex items-center gap-3 transition-all duration-200',
        'hover:bg-[#141824] active:bg-[#1A1F2D]',
        isSelected && 'bg-[#141824]',
        isSelected && 'ring-1 ring-[#D4AF37]/20'
      )}
    >
      {/* Avatar - Circular */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <img
            src={conversation.participantAvatar}
            alt={conversation.participantName}
            className="w-full h-full object-cover"
          />
        </div>
        {conversation.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4CAF50] rounded-full border-2 border-[#111522]"></div>
        )}
      </div>

      {/* Content - Username, Message, Timestamp */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-white text-[15px] leading-tight truncate">
            {conversation.participantName}
          </h3>
          <span className="text-[12px] text-[#8A8F9A] flex-shrink-0 ml-2">
            {formatTime(conversation.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] text-[#8A8F9A] truncate leading-tight flex-1 min-w-0">
            {conversation.lastMessage}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex-shrink-0 w-5 h-5 bg-[#D4AF37] text-[#0B0E17] text-[11px] font-bold rounded-full flex items-center justify-center">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;
