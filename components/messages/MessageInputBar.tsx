import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface MessageInputBarProps {
  onSendMessage: (text: string) => void;
  placeholder?: string;
}

const MessageInputBar: React.FC<MessageInputBarProps> = ({
  onSendMessage,
  placeholder = 'Digite aqui...',
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div 
      className="px-4 py-3 bg-[#111522] relative"
      style={{
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center gap-2">
        {/* Botão de Emoji */}
        <button
          className="p-2 text-[#8A8F9A] hover:text-[#D4AF37] transition-colors flex-shrink-0"
          aria-label="Emoji"
        >
          <Smile size={20} />
        </button>

        {/* Container totalmente arredondado com input branco */}
        <div className="flex-1 relative">
          <div className="w-full bg-white rounded-full px-4 py-2.5 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-[#0B0E17] placeholder-[#8A8F9A] text-[14px] focus:outline-none"
            />
            {/* Botão de Anexo */}
            <button
              className="p-1 text-[#8A8F9A] hover:text-[#0B0E17] transition-colors flex-shrink-0"
              aria-label="Anexar"
            >
              <Paperclip size={18} />
            </button>
          </div>
        </div>

        {/* Botão de Enviar - Vira dourado quando há texto */}
        <motion.button
          onClick={handleSend}
          disabled={!inputText.trim()}
          whileHover={inputText.trim() ? { scale: 1.05 } : {}}
          whileTap={inputText.trim() ? { scale: 0.95 } : {}}
          className={cn(
            'p-2.5 rounded-full transition-colors flex-shrink-0',
            inputText.trim()
              ? 'bg-[#D4AF37] text-[#0B0E17] hover:bg-[#C6A663]'
              : 'bg-[#141824] text-[#8A8F9A] cursor-not-allowed'
          )}
          aria-label="Enviar mensagem"
        >
          <Send size={18} />
        </motion.button>
      </div>
    </div>
  );
};

export default MessageInputBar;
