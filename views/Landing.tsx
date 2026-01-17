import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Shield, Film } from 'lucide-react';

interface LandingProps {
  onEnterApp: () => void;
  onRegister?: () => void;
}

const Landing: React.FC<LandingProps> = ({ onEnterApp, onRegister }) => {
  // Lista de marcas para o carrossel
  const brands = ['O2 Filmes', 'Conspiração', 'Gullane', 'KondZilla'];
  const [currentBrandIndex, setCurrentBrandIndex] = useState(0);

  // Carrossel automático horizontal - mostra 2 marcas por vez
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBrandIndex((prev) => {
        // Avança de 2 em 2, mas volta ao início quando chega ao final
        const nextIndex = prev + 2;
        // Se passar do limite, volta ao início
        if (nextIndex >= brands.length) {
          return 0;
        }
        return nextIndex;
      });
    }, 3000); // Muda a cada 3 segundos

    return () => clearInterval(interval);
  }, [brands.length]);

  return (
    <div className="min-h-screen bg-navy text-offWhite selection:bg-gold selection:text-navy">
      {/* Navbar */}
      <nav className="fixed top-0 z-40 w-full border-b border-white/5 bg-navy/80 backdrop-blur-md">
        <div className="container flex items-center justify-between px-6 py-4 mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-gold text-navy">
              <Film size={20} className="fill-current" />
            </div>
            <span className="text-2xl font-bold font-serif text-white tracking-tight">CrewMatch</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-offWhite/70">
            <a href="#" className="hover:text-gold transition-colors">Manifesto</a>
            <a href="#" className="hover:text-gold transition-colors">Produtoras</a>
            <a href="#" className="hover:text-gold transition-colors">Talentos</a>
          </div>
          <button 
            onClick={onEnterApp}
            className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-navy transition-transform transform bg-gold rounded hover:scale-105 hover:bg-white"
          >
            Acessar
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative flex flex-col items-center justify-start min-h-screen px-6 pt-32 overflow-hidden text-center">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gold/10 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-block px-3 py-1 mb-6 text-[10px] font-bold tracking-[0.2em] uppercase border border-gold/30 text-gold rounded-full bg-gold/5 backdrop-blur-sm">
            A Elite do Audiovisual
          </span>
          <h1 className="mb-8 font-serif text-5xl md:text-7xl lg:text-8xl font-medium text-white leading-[1.1]">
            Conectando<br/>
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-white via-offWhite to-white/50">Visão & Técnica</span>
          </h1>
          <p className="max-w-2xl mx-auto mb-12 text-lg font-light leading-relaxed text-offWhite/60 font-sans">
            Uma plataforma exclusiva para conectar as maiores produtoras do Brasil aos profissionais mais requisitados do mercado. Sem ruído, apenas conexões de alto nível.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center mb-16">
            <button 
              onClick={onRegister || onEnterApp}
              className="flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold tracking-widest text-white uppercase transition-all shadow-lg bg-gold rounded-lg hover:bg-goldHover hover:shadow-blue-900/20 group"
            >
              Sou Profissional
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button 
              onClick={onEnterApp}
              className="px-8 py-4 text-sm font-bold tracking-widest text-gold uppercase transition-all border border-gold/30 rounded-lg hover:bg-gold/10 hover:border-gold"
            >
              Sou Produtora
            </button>
          </div>

          {/* Carrossel de Marcas - Trusted By */}
          <div className="relative w-full py-8">
            <p className="mb-6 text-xs font-medium tracking-widest uppercase text-offWhite/40 font-sans">
              Trusted By
            </p>
            
            {/* Desktop: Layout estático horizontal */}
            <div className="hidden md:flex container mx-auto px-6 justify-center gap-12">
              {brands.map((brand, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.5, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="font-serif text-lg font-medium text-gold/40 hover:text-gold/60 transition-colors"
                >
                  {brand}
                </motion.span>
              ))}
            </div>

            {/* Mobile: Carrossel automático horizontal - 2 marcas por vez */}
            <div className="md:hidden container mx-auto px-6">
              <div className="flex justify-center items-center h-8 overflow-hidden relative w-full">
                <div className="flex gap-8 items-center justify-center w-full">
                  <AnimatePresence mode="sync">
                    {[0, 1].map((offset) => {
                      const index = currentBrandIndex + offset;
                      const brandIndex = index % brands.length;
                      return (
                        <motion.span
                          key={`${currentBrandIndex}-${offset}`}
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 0.5, x: 0 }}
                          exit={{ opacity: 0, x: -40 }}
                          transition={{ duration: 0.6, ease: 'easeInOut' }}
                          className="font-serif text-lg font-medium text-gold/40 whitespace-nowrap"
                        >
                          {brands[brandIndex]}
                        </motion.span>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-graphite">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-8 border border-white/5 bg-navy rounded-2xl hover:border-gold/20 transition-colors group">
              <div className="w-12 h-12 mb-6 flex items-center justify-center bg-gold/10 rounded-xl text-gold group-hover:bg-gold group-hover:text-navy transition-colors">
                <Star size={24} />
              </div>
              <h3 className="mb-3 font-serif text-2xl text-white">Curadoria Premium</h3>
              <p className="text-offWhite/60 leading-relaxed">Acesso restrito a profissionais com portfolio verificado e experiência comprovada em grandes produções.</p>
            </div>
            <div className="p-8 border border-white/5 bg-navy rounded-2xl hover:border-gold/20 transition-colors group">
              <div className="w-12 h-12 mb-6 flex items-center justify-center bg-gold/10 rounded-xl text-gold group-hover:bg-gold group-hover:text-navy transition-colors">
                <Shield size={24} />
              </div>
              <h3 className="mb-3 font-serif text-2xl text-white">Segurança & Trust</h3>
              <p className="text-offWhite/60 leading-relaxed">Sistema de avaliação mútua e pagamentos garantidos via escrow para tranquilidade total.</p>
            </div>
            <div className="p-8 border border-white/5 bg-navy rounded-2xl hover:border-gold/20 transition-colors group">
              <div className="w-12 h-12 mb-6 flex items-center justify-center bg-gold/10 rounded-xl text-gold group-hover:bg-gold group-hover:text-navy transition-colors">
                <Film size={24} />
              </div>
              <h3 className="mb-3 font-serif text-2xl text-white">Matching Inteligente</h3>
              <p className="text-offWhite/60 leading-relaxed">Algoritmo que conecta a estética do profissional com a identidade visual do projeto.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;