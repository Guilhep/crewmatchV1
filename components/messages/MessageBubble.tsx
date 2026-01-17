import React from 'react';
import { motion } from 'framer-motion';
import { Message } from '../../types/messages';
import { cn } from '../../lib/utils';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  senderName?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  senderName,
}) => {
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  // Mensagem do sistema (match)
  if (message.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center my-4"
      >
        <div className="px-4 py-2 bg-[#141824] border border-[#1A1F2D] rounded-full">
          <p className="text-[12px] text-[#8A8F9A] text-center">{message.text}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex w-full mb-3',
        isMine ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={cn(
        'flex flex-col max-w-[75%] sm:max-w-[65%]',
        isMine ? 'items-end' : 'items-start'
      )}>
        {/* Bubble da mensagem */}
        <div
          className={cn(
            'px-3 py-2',
            'shadow-sm',
            isMine
              ? 'bg-[#D4AF37] text-[#0B0E17] rounded-2xl rounded-br-sm'
              : 'bg-[#1A1F2D] text-white rounded-2xl rounded-bl-sm'
          )}
        >
          <p className="text-[14px] leading-[1.4] whitespace-pre-wrap break-words">
            {message.text}
          </p>
        </div>

        {/* Timestamp - Pequeno e sutil */}
        <span className={cn(
          'text-[11px] text-[#8A8F9A] mt-1 px-1',
          isMine ? 'text-right' : 'text-left'
        )}>
          {formatTime(message.timestamp)}
          {isMine && (
            <span className="ml-1.5 text-[#D4AF37]">
              {message.read ? '✓✓' : '✓'}
            </span>
          )}
        </span>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
