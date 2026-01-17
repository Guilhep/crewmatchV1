import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { FEATURED_COMPANIES, FeaturedCompany } from '../constants/featuredCompanies';
import { cn } from '../lib/utils';

interface FeaturedCompaniesCarouselProps {
  onCompanyClick?: (company: FeaturedCompany) => void;
  className?: string;
}

const FeaturedCompaniesCarousel: React.FC<FeaturedCompaniesCarouselProps> = ({
  onCompanyClick,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Autoplay - muda a cada 5 segundos
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % FEATURED_COMPANIES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleSwipe = (swipeInfo: PanInfo) => {
    if (swipeInfo.offset.x > 50) {
      // Swipe right - previous
      setDirection(-1);
      setCurrentIndex((prev) => (prev - 1 + FEATURED_COMPANIES.length) % FEATURED_COMPANIES.length);
    } else if (swipeInfo.offset.x < -50) {
      // Swipe left - next
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % FEATURED_COMPANIES.length);
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  };

  const currentCompany = FEATURED_COMPANIES[currentIndex];

  return (
    <div
      className={cn(
        'relative w-full h-48 rounded-2xl overflow-hidden cursor-pointer group border border-white/10 hover:border-gold/50 transition-all',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={() => onCompanyClick?.(currentCompany)}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => handleSwipe(info)}
          className="absolute inset-0"
        >
          {/* Imagem de Fundo */}
          <div className="absolute inset-0">
            <img
              src={currentCompany.imageUrl}
              alt={currentCompany.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Overlay Gradiente */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent"></div>

          {/* Badge de Destaque */}
          <div className="absolute top-4 left-4 z-10">
            <span className="px-2 py-1 text-[10px] font-bold uppercase bg-gold text-navy rounded tracking-widest shadow-lg">
              Destaque
            </span>
          </div>

          {/* Conteúdo */}
          <div className="absolute inset-0 p-8 flex flex-col justify-center items-start z-10">
            <h3 className="font-serif text-3xl text-white font-bold mb-2 group-hover:translate-x-2 transition-transform">
              {currentCompany.name}
            </h3>
            <p className="text-offWhite/70 max-w-sm text-sm">
              {currentCompany.description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicadores (Dots) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {FEATURED_COMPANIES.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(index);
            }}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === currentIndex
                ? 'bg-gold w-6'
                : 'bg-white/30 hover:bg-white/50'
            )}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedCompaniesCarousel;

