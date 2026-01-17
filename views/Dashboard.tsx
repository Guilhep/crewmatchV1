import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import MobileNav from '../components/MobileNav';
import FeaturedCompaniesCarousel from '../components/FeaturedCompaniesCarousel';
import { FeaturedCompany } from '../constants/featuredCompanies';
import { fetchConversations } from '../lib/chat';
import { Conversation } from '../types/messages';

interface DashboardProps {
  onNavigateToMatch: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToChat?: (participantId?: string) => void;
  onNavigateToFeed?: () => void;
  onNavigateToJobs?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToMatch, onNavigateToProfile, onNavigateToChat, onNavigateToFeed, onNavigateToJobs }) => {
  const { user, profile, loading: profileLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'chat' | 'profile'>('home');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  
  // Carregar conversas
  const loadConversations = async () => {
    if (!user?.id) return;
    
    setLoadingConversations(true);
    const result = await fetchConversations(user.id);
    if (result.success && result.conversations) {
      setConversations(result.conversations);
    }
    setLoadingConversations(false);
  };

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  // Extrair primeiro nome do usuário
  const getUserFirstName = () => {
    if (profileLoading) return 'Visitante';
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    }
    if (profile?.name) {
      return profile.name.split(' ')[0];
    }
    return 'Visitante';
  };

  const handleLogout = async () => {
    if (confirm('Deseja realmente encerrar a sessão?')) {
      await signOut();
    }
  };

  const firstName = getUserFirstName();
  const recentConversations = conversations.slice(0, 2);
  return (
    <div className="flex flex-col h-full bg-navy">
      {/* Header com botão de logout */}
      <div className="sticky top-0 z-40 bg-navy/90 backdrop-blur-sm border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-white">CrewMatch</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-offWhite/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Encerrar sessão"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline text-sm">Sair</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {/* Welcome Section */}
        <div className="mb-10">
            {profileLoading ? (
              <div className="mb-2">
                <div className="h-9 w-48 bg-graphite rounded animate-pulse mb-2"></div>
                <div className="h-5 w-64 bg-graphite rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <h2 className="font-serif text-3xl text-white mb-2">Olá, {firstName}.</h2>
                <p className="text-offWhite/60">
                  {conversations.filter(c => c.unreadCount > 0).length > 0 
                    ? `Você tem ${conversations.filter(c => c.unreadCount > 0).length} ${conversations.filter(c => c.unreadCount > 0).length === 1 ? 'nova mensagem' : 'novas mensagens'} esperando.`
                    : 'Explore novas oportunidades e conecte-se com produtoras.'}
                </p>
              </>
            )}
        </div>

        {/* Featured Companies Carousel */}
        <div className="mb-10">
          <FeaturedCompaniesCarousel
            onCompanyClick={(company: FeaturedCompany) => {
              // Navegar para o perfil da empresa
              // Por enquanto, vamos apenas logar ou navegar para match
              console.log('Company clicked:', company);
              // TODO: Implementar navegação para /company/[slug]
              onNavigateToMatch();
            }}
          />
        </div>

        {/* Recent Matches / Messages */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-xl text-white">Mensagens Recentes</h3>
                <button 
                  onClick={() => onNavigateToChat?.()}
                  className="text-xs font-bold uppercase text-gold tracking-widest hover:text-white hover:underline transition-colors"
                >
                  Ver todas
                </button>
            </div>

            {loadingConversations ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center p-4 bg-graphite rounded-xl border border-white/5 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-graphite/50 mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-graphite/50 rounded mb-2"></div>
                      <div className="h-3 w-full bg-graphite/50 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentConversations.length === 0 ? (
              <div className="text-center py-8 bg-graphite/50 rounded-xl border border-white/5">
                <p className="text-offWhite/60 mb-2">Nenhuma mensagem ainda</p>
                <p className="text-sm text-offWhite/40">Comece a conversar com produtoras</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentConversations.map((conv) => (
                  <div 
                    key={conv.id} 
                    className="flex items-center p-4 bg-graphite rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                    onClick={() => onNavigateToChat?.(conv.participantId)}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 border border-white/10 flex-shrink-0">
                      <img src={conv.participantAvatar} alt={conv.participantName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-white text-sm truncate">{conv.participantName}</h4>
                        <span className="text-[10px] text-offWhite/40 flex-shrink-0 ml-2">
                          {conv.lastMessageTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-offWhite/60 line-clamp-2">{conv.lastMessage || 'Sem mensagens'}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="ml-2 bg-gold text-navy text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Stats / Patent */}
        <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-graphite rounded-xl border border-white/5">
                <span className="block text-[10px] uppercase tracking-widest text-offWhite/50 mb-2">Nível</span>
                {profileLoading ? (
                  <div className="h-8 w-24 bg-graphite/50 rounded animate-pulse"></div>
                ) : (
                  <div className="flex items-center gap-2 text-gold">
                    <span className="font-serif text-2xl font-bold capitalize">
                      {profile?.level_id || 'Trainee'}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-gold animate-pulse"></div>
                  </div>
                )}
            </div>
             <div className="p-5 bg-graphite rounded-xl border border-white/5">
                <span className="block text-[10px] uppercase tracking-widest text-offWhite/50 mb-2">Conexões</span>
                {loadingConversations ? (
                  <div className="h-8 w-12 bg-graphite/50 rounded animate-pulse"></div>
                ) : (
                  <div className="flex items-center gap-2 text-white">
                    <span className="font-serif text-2xl font-bold">{conversations.length}</span>
                    {conversations.length > 0 && (
                      <span className="text-xs text-offWhite/60 font-sans font-medium">total</span>
                    )}
                  </div>
                )}
            </div>
        </div>
      </div>

      {/* Mobile Navigation Dock */}
      <MobileNav
        activeTab={activeTab}
        onHomeClick={() => setActiveTab('home')}
        onFeedClick={() => {
          setActiveTab('feed');
          onNavigateToFeed?.();
        }}
        onChatClick={() => {
          setActiveTab('chat');
          onNavigateToChat?.();
        }}
        onProfileClick={() => {
          setActiveTab('profile');
          onNavigateToProfile?.();
        }}
        onMatchClick={onNavigateToMatch}
        onJobsClick={onNavigateToJobs || undefined}
      />
    </div>
  );
};

export default Dashboard;