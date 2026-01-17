import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, X } from 'lucide-react';
import { CallStatus } from '../../hooks/useVoiceCall';

interface VoiceCallModalProps {
  isOpen: boolean;
  callStatus: CallStatus;
  participantName: string;
  participantAvatar: string;
  isMuted: boolean;
  callDuration: number;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
}

const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  callStatus,
  participantName,
  participantAvatar,
  isMuted,
  callDuration,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
}) => {
  // Formatar duração da chamada
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Tocar som de chamada (opcional)
  useEffect(() => {
    if (callStatus === 'ringing') {
      // Aqui você pode adicionar um som de toque
      console.log('🔔 Chamada recebida!');
    }
  }, [callStatus]);

  return (
    <>
      {/* Elemento de áudio remoto (invisível) */}
      <audio id="remote-audio" autoPlay />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-navy/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm"
            >
              {/* Card da Chamada */}
              <div className="bg-graphite border border-white/10 rounded-3xl p-8 shadow-2xl">
                {/* Avatar e Nome */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gold/30 shadow-xl">
                      <img
                        src={participantAvatar}
                        alt={participantName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Indicador de status */}
                    {callStatus === 'connected' && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-graphite flex items-center justify-center"
                      >
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </motion.div>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{participantName}</h3>
                  
                  {/* Status da Chamada */}
                  <div className="text-center">
                    {callStatus === 'calling' && (
                      <p className="text-offWhite/60 animate-pulse">Chamando...</p>
                    )}
                    {callStatus === 'ringing' && (
                      <p className="text-gold animate-pulse font-semibold">Chamada recebida</p>
                    )}
                    {callStatus === 'connected' && (
                      <p className="text-green-400 font-mono text-lg">{formatDuration(callDuration)}</p>
                    )}
                    {callStatus === 'ended' && (
                      <p className="text-offWhite/60">Chamada encerrada</p>
                    )}
                  </div>
                </div>

                {/* Controles */}
                <div className="flex items-center justify-center gap-4">
                  {callStatus === 'ringing' ? (
                    <>
                      {/* Rejeitar */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onReject}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 flex items-center justify-center transition-colors"
                        aria-label="Rejeitar chamada"
                      >
                        <PhoneOff size={24} />
                      </motion.button>

                      {/* Aceitar */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAccept}
                        className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 flex items-center justify-center transition-colors"
                        aria-label="Aceitar chamada"
                      >
                        <Phone size={24} />
                      </motion.button>
                    </>
                  ) : callStatus === 'calling' || callStatus === 'connected' ? (
                    <>
                      {/* Mute/Unmute */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleMute}
                        className={`w-14 h-14 rounded-full ${
                          isMuted
                            ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                            : 'bg-white/10 text-white border-2 border-white/20'
                        } hover:bg-white/20 shadow-lg flex items-center justify-center transition-all`}
                        aria-label={isMuted ? 'Ativar microfone' : 'Silenciar microfone'}
                      >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                      </motion.button>

                      {/* Encerrar */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onEnd}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 flex items-center justify-center transition-colors"
                        aria-label="Encerrar chamada"
                      >
                        <PhoneOff size={24} />
                      </motion.button>
                    </>
                  ) : null}
                </div>

                {/* Indicador de áudio */}
                {callStatus === 'connected' && (
                  <div className="mt-6 flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: isMuted ? 4 : [4, 12, 4],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                        className="w-1 bg-gold rounded-full"
                        style={{ height: 4 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceCallModal;
