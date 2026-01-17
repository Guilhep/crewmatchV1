import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, CheckCircle } from 'lucide-react';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  partnerName: string;
  partnerImage: string;
  myImage: string;
  onStartConversation?: () => void;
}

const MatchModal: React.FC<MatchModalProps> = ({ 
  isOpen, 
  onClose, 
  jobTitle, 
  partnerName,
  partnerImage,
  myImage,
  onStartConversation
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-lg p-8 overflow-hidden text-center border shadow-2xl bg-graphite rounded-2xl border-gold/30"
          >
            {/* Confetti/Particles decoration (Simplified as decorative circles) */}
            <div className="absolute top-0 left-0 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 translate-x-1/2 translate-y-1/2 rounded-full bg-gold/10 blur-3xl"></div>

            <h2 className="mb-2 text-4xl italic font-bold tracking-tight font-serif text-gold">
              It's a Match!
            </h2>
            <p className="mb-8 text-offWhite/60 font-sans">
              Você e <span className="text-white font-semibold">{partnerName}</span> se conectaram para o projeto.
            </p>

            <div className="flex items-center justify-center gap-4 mb-10">
              <div className="relative">
                <img 
                  src={myImage} 
                  alt="You" 
                  className="w-24 h-24 object-cover border-4 border-navy rounded-full shadow-lg"
                />
              </div>
              <div className="text-gold">
                <CheckCircle size={32} fill="#C6A663" className="text-navy" />
              </div>
              <div className="relative">
                <img 
                  src={partnerImage} 
                  alt={partnerName} 
                  className="w-24 h-24 object-cover border-4 border-navy rounded-full shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 bg-gold text-navy text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Produtora
                </div>
              </div>
            </div>

            <div className="mb-8">
               <h3 className="font-serif text-xl text-white mb-1">{jobTitle}</h3>
               <p className="text-sm text-offWhite/50 uppercase tracking-widest text-[10px]">Novo Projeto Iniciado</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  onStartConversation?.();
                  onClose();
                }}
                className="w-full py-4 text-sm font-bold tracking-wider text-white uppercase transition-all shadow-lg rounded-xl bg-gold hover:bg-goldHover flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Iniciar Conversa
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 text-sm font-bold tracking-wider uppercase transition-colors border rounded-xl border-white/10 text-offWhite hover:bg-white/5 hover:text-white"
              >
                Continuar Explorando
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchModal;