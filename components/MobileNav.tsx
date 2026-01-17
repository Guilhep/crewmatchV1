import React from 'react';
import { LayoutGrid, Rss, MessageSquare, User, Camera, Briefcase } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface MobileNavProps {
  activeTab?: 'home' | 'feed' | 'chat' | 'profile' | 'jobs';
  onHomeClick?: () => void;
  onFeedClick?: () => void;
  onChatClick?: () => void;
  onProfileClick?: () => void;
  onMatchClick?: () => void;
  onJobsClick?: () => void;
  isCompany?: boolean; // Permite override manual do tipo de conta
}

const MobileNav: React.FC<MobileNavProps> = ({
  activeTab = 'home',
  onHomeClick,
  onFeedClick,
  onChatClick,
  onProfileClick,
  onMatchClick,
  onJobsClick,
  isCompany: isCompanyProp,
}) => {
  const { profile, loading } = useAuth();
  // Defensive: Verificar se profile existe e account_type antes de usar
  // Se ainda está carregando ou profile não existe, assumir profissional (padrão)
  // Permite override manual via prop
  const isCompany = isCompanyProp !== undefined
    ? isCompanyProp
    : (!loading && profile && profile.account_type === 'company');
  const isActive = (tab: string) => activeTab === tab;
  
  // Se ainda está carregando, mostrar estado neutro (profissional por padrão)
  // Isso evita que o componente quebre enquanto os dados carregam

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[999] safe-bottom">
      {/* SVG para criar o recorte curvo côncavo no topo (estilo Dock) */}
      <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none">
        <svg
          className="w-full h-full"
          viewBox="0 0 375 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Path que cria a curva côncava suave no centro - estilo Dock */}
          <path
            d="M0 48 L0 12 C60 8 120 4 160 6 C200 8 240 8 280 6 C320 4 375 8 375 12 L375 48 Z"
            fill="#1C1F26"
          />
        </svg>
      </div>

      {/* Container principal da navegação */}
      <div className="relative bg-graphite border-t border-white/5 pt-2 pb-3 px-2">
        {/* Container dos ícones */}
        <div className="grid grid-cols-5 items-end relative max-w-md mx-auto">
          {/* Botão Home */}
          <button
            onClick={onHomeClick}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('home')
                ? 'text-gold'
                : 'text-offWhite/40 hover:text-gold'
            }`}
          >
            <LayoutGrid size={22} strokeWidth={isActive('home') ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          {/* Botão Feed */}
          <button
            onClick={onFeedClick}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('feed')
                ? 'text-gold'
                : 'text-offWhite/40 hover:text-gold'
            }`}
          >
            <Rss size={22} strokeWidth={isActive('feed') ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Feed</span>
          </button>

          {/* Botão Central Flutuante - Match (Profissional) ou Jobs (Produtora) */}
          <div className="flex justify-center items-end">
            {isCompany ? (
              <button
                onClick={() => onJobsClick?.()}
                className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold via-gold to-goldHover shadow-2xl shadow-gold/40 hover:shadow-gold/60 transition-all duration-300 hover:scale-110 active:scale-95 -mt-8"
              >
                {/* Anel externo sutil para separação visual */}
                <div className="absolute -inset-1 rounded-full border-2 border-gold/20"></div>
                
                {/* Ícone Briefcase */}
                <Briefcase 
                  size={26} 
                  className="text-white relative z-10 transition-transform group-hover:translate-y-[-2px]" 
                  strokeWidth={2.5}
                />
                
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            ) : (
              <button
                onClick={() => onMatchClick?.()}
                className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold via-gold to-goldHover shadow-2xl shadow-gold/40 hover:shadow-gold/60 transition-all duration-300 hover:scale-110 active:scale-95 -mt-8"
              >
                {/* Anel externo sutil para separação visual */}
                <div className="absolute -inset-1 rounded-full border-2 border-gold/20"></div>
                
                {/* Ícone Camera */}
                <Camera 
                  size={26} 
                  className="text-white relative z-10 transition-transform group-hover:translate-y-[-2px]" 
                  strokeWidth={2.5}
                  fill="currentColor"
                />
                
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            )}
          </div>

          {/* Botão Chat */}
          <button
            onClick={onChatClick}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('chat')
                ? 'text-gold'
                : 'text-offWhite/40 hover:text-gold'
            }`}
          >
            <MessageSquare size={22} strokeWidth={isActive('chat') ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Chat</span>
          </button>

          {/* Botão Perfil */}
          <button
            onClick={onProfileClick}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('profile')
                ? 'text-gold'
                : 'text-offWhite/40 hover:text-gold'
            }`}
          >
            <User size={22} strokeWidth={isActive('profile') ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Perfil</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;

