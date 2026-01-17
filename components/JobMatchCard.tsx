import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, Calendar, X, Heart } from 'lucide-react';
import { Job } from '../lib/jobs';
import { cn } from '../lib/utils';

interface JobMatchCardProps {
  job: Job;
  index: number;
  currentIndex: number;
  onSwipe?: (direction: 'left' | 'right') => void;
  drag?: boolean;
}

const JobMatchCard: React.FC<JobMatchCardProps> = ({
  job,
  index,
  currentIndex,
  onSwipe,
  drag = false,
}) => {
  const isActive = index === currentIndex;
  const isNext = index === currentIndex + 1;
  const isPrevious = index === currentIndex - 1;
  const isVisible = isActive || isNext || isPrevious;

  // Calcular posição e escala baseado na posição relativa
  const getCardStyle = () => {
    if (isActive) {
      return {
        scale: 1,
        x: 0, // Centralizado
        zIndex: 30,
        opacity: 1,
      };
    }
    if (isNext) {
      // Card próximo - aparece parcialmente à direita (peeking)
      return {
        scale: 0.92,
        x: 200, // Offset para mostrar ~40-50px do card à direita
        zIndex: 20,
        opacity: 0.4,
      };
    }
    if (isPrevious) {
      // Card anterior - aparece parcialmente à esquerda (peeking)
      return {
        scale: 0.92,
        x: -200, // Offset para mostrar ~40-50px do card à esquerda
        zIndex: 20,
        opacity: 0.4,
      };
    }
    return {
      scale: 0.85,
      x: index < currentIndex ? -400 : 400,
      zIndex: 10,
      opacity: 0,
    };
  };

  const cardStyle = getCardStyle();

  // Debug: verificar se o card está sendo renderizado
  if (!job) {
    console.warn('JobMatchCard: job is null or undefined');
    return null;
  }

  if (!isVisible) {
    // Não renderizar cards que não são visíveis para performance
    return null;
  }

  return (
    <motion.div
      className={cn(
        'absolute',
        'cursor-grab active:cursor-grabbing',
        'flex flex-col'
      )}
      style={{
        left: '50%',
        top: '50%',
        width: '100%',
        maxWidth: '400px',
        height: '100%',
        maxHeight: '75vh',
        backgroundColor: '#1E1E1E',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        zIndex: Math.min(cardStyle.zIndex, 50), // Máximo z-index 50 (menor que navbar 100)
        transform: 'translate(-50%, -50%)',
      }}
      drag={drag && isActive ? 'x' : false}
      dragConstraints={false}
      dragElastic={0.3}
      onDragEnd={(_, info) => {
        if (!onSwipe || !isActive) return;
        if (info.offset.x > 100) {
          onSwipe('right');
        } else if (info.offset.x < -100) {
          onSwipe('left');
        }
      }}
      initial={false}
      animate={{
        x: `calc(-50% + ${cardStyle.x}px)`,
        y: '-50%',
        scale: cardStyle.scale,
        opacity: cardStyle.opacity,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 25,
      }}
    >
      {/* Topo (Imagem) - flex: 4 (40% do card) */}
      <div className="relative flex-shrink-0" style={{ flex: 4, width: '100%', minHeight: 0 }}>
        <img
          src={job.recruiter?.avatar_url || 'https://picsum.photos/800/600?random=' + job.id}
          alt={job.title}
          className="w-full h-full object-cover"
        />
        
        {/* Badge Superior Esquerda - Nome da Produtora */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-md">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            {(job.recruiter?.company_name || job.recruiter?.name || 'Produtora').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Meio (Informações/Texto) - flex: 3.5 (35% do card) */}
      <div 
        className="flex flex-col flex-shrink-0" 
        style={{ 
          flex: 3.5, 
          padding: '12px',
          overflowY: 'auto',
          minHeight: 0
        }}
      >
        {/* Título */}
        <h2 className="text-base font-bold text-white mb-1.5 leading-tight line-clamp-2">
          {job.title}
        </h2>

        {/* Informações em Linha (Preço, Data, Localização) */}
        <div className="flex items-center gap-2.5 mb-1.5 text-xs flex-wrap">
          {job.budget && (
            <div className="flex items-center gap-1 text-[#D2D5DA]">
              <DollarSign size={13} className="text-[#9AA0A6]" />
              <span className="font-semibold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(job.budget)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[#D2D5DA]">
            <Calendar size={13} className="text-[#9AA0A6]" />
            <span className="truncate">
              {new Date(job.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
          {job.location && (
            <div className="flex items-center gap-1 text-[#D2D5DA]">
              <MapPin size={13} className="text-[#9AA0A6]" />
              <span className="truncate">{job.location}</span>
            </div>
          )}
        </div>

        {/* Descrição - Scroll interno acontece aqui */}
        <div className="flex-1 min-h-0 mb-1.5">
          <p className="text-xs text-[#9AA0A6] leading-tight">
            {job.description}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex flex-wrap gap-1.5 mb-1.5 flex-shrink-0">
          <span className="px-1.5 py-0.5 text-[9px] font-medium text-white/90 bg-green-500/20 rounded-full border border-green-500/30">
            VAGA ABERTA
          </span>
        </div>
      </div>

      {/* Fundo (Ações/Botões) - flex: 2 (20% do card) */}
      <div 
        className="flex-shrink-0" 
        style={{ 
          flex: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px'
        }}
      >
        <div className="flex items-center justify-center gap-6">
          {/* Botão Rejeitar (X) */}
          <motion.button
            onClick={() => onSwipe?.('left')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-[#2A2F3A] text-[#9AA0A6] hover:bg-[#3A3F4A] hover:text-white transition-colors shadow-lg"
          >
            <X size={22} strokeWidth={2.5} />
          </motion.button>

          {/* Botão Favoritar (Coração) */}
          <motion.button
            onClick={() => onSwipe?.('right')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-gold to-goldHover text-white shadow-lg shadow-gold/30 hover:shadow-gold/50 transition-shadow"
          >
            <Heart size={22} fill="currentColor" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default JobMatchCard;
