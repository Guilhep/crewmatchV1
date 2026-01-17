import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Briefcase, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import MobileNav from '../components/MobileNav';
import CreateJobModal from '../components/jobs/CreateJobModal';
import { fetchMyJobs, Job } from '../lib/jobs';
import { fetchConversations } from '../lib/chat';
import { Conversation } from '../types/messages';

interface CompanyDashboardProps {
  onNavigateToProfile?: () => void;
  onNavigateToChat?: (participantId?: string) => void;
  onNavigateToFeed?: () => void;
  onNavigateToJobs?: () => void;
}

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  onNavigateToProfile,
  onNavigateToChat,
  onNavigateToFeed,
  onNavigateToJobs
}) => {
  const { user, profile, loading: profileLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'chat' | 'profile'>('home');
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  
  // Carregar vagas
  const loadJobs = async () => {
    if (!user?.id) return;
    
    setLoadingJobs(true);
    const result = await fetchMyJobs(user.id);
    if (result.success && result.jobs) {
      setJobs(result.jobs);
    }
    setLoadingJobs(false);
  };

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
    loadJobs();
    loadConversations();
  }, [user?.id]);

  // Extrair nome da empresa
  const getCompanyName = () => {
    if (profileLoading) return 'Empresa';
    if (profile?.company_name) {
      return profile.company_name;
    }
    if (profile?.name) {
      return profile.name;
    }
    return 'Empresa';
  };

  const handleLogout = async () => {
    if (confirm('Deseja realmente encerrar a sessão?')) {
      await signOut();
    }
  };

  const handleJobCreated = () => {
    setShowCreateJobModal(false);
    loadJobs();
  };

  const companyName = getCompanyName();

  // Calcular estatísticas
  const activeJobsCount = jobs.filter(j => j.status === 'open').length;
  const totalCandidates = jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0);
  const recentJobs = jobs.slice(0, 3);
  const recentConversations = conversations.slice(0, 2);

  return (
    <div className="flex flex-col h-full bg-navy">
      {/* Header com botão de logout */}
      <div className="sticky top-0 z-40 bg-navy/90 backdrop-blur-sm border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-white">CrewMatch</h1>
            <p className="text-xs text-offWhite/60 mt-0.5">Painel da Produtora</p>
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
              <h2 className="font-serif text-3xl text-white mb-2">Olá, {companyName}.</h2>
              <p className="text-offWhite/60">
                Gerencie suas vagas e encontre os melhores profissionais para seus projetos.
              </p>
            </>
          )}
        </div>

        {/* Create Job Button - Destaque */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateJobModal(true)}
            className="w-full bg-gradient-to-r from-gold to-goldHover text-navy font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-gold/20 transition-all"
          >
            <Plus size={24} />
            <span className="text-lg">Criar Nova Vaga</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 bg-graphite rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={16} className="text-gold" />
              <span className="block text-[10px] uppercase tracking-widest text-offWhite/50">Vagas Ativas</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              {loadingJobs ? (
                <div className="h-8 w-12 bg-graphite/50 rounded animate-pulse"></div>
              ) : (
                <span className="font-serif text-2xl font-bold">{activeJobsCount}</span>
              )}
            </div>
          </div>

          <div className="p-5 bg-graphite rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-gold" />
              <span className="block text-[10px] uppercase tracking-widest text-offWhite/50">Candidatos</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              {loadingJobs ? (
                <div className="h-8 w-12 bg-graphite/50 rounded animate-pulse"></div>
              ) : (
                <>
                  <span className="font-serif text-2xl font-bold">{totalCandidates}</span>
                  {totalCandidates > 0 && (
                    <span className="text-xs text-green-400 font-sans font-medium">total</span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="p-5 bg-graphite rounded-xl border border-white/5 col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-gold" />
              <span className="block text-[10px] uppercase tracking-widest text-offWhite/50">Total de Vagas</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              {loadingJobs ? (
                <div className="h-8 w-12 bg-graphite/50 rounded animate-pulse"></div>
              ) : (
                <>
                  <span className="font-serif text-2xl font-bold">{jobs.length}</span>
                  <span className="text-xs text-offWhite/60 font-sans font-medium">criadas</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-xl text-white">Vagas Recentes</h3>
            <button
              onClick={() => onNavigateToJobs?.()}
              className="text-xs font-bold uppercase text-gold tracking-widest hover:text-white hover:underline transition-colors"
            >
              Ver todas
            </button>
          </div>

          {loadingJobs ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-graphite rounded-xl border border-white/5 animate-pulse">
                  <div className="h-4 w-3/4 bg-graphite/50 rounded mb-2"></div>
                  <div className="h-3 w-1/2 bg-graphite/50 rounded"></div>
                </div>
              ))}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-8 bg-graphite/50 rounded-xl border border-white/5">
              <Briefcase size={48} className="text-offWhite/20 mx-auto mb-4" />
              <p className="text-offWhite/60 mb-2">Nenhuma vaga criada ainda</p>
              <p className="text-sm text-offWhite/40">Clique no botão acima para criar sua primeira vaga</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => onNavigateToJobs?.()}
                  className="p-4 bg-graphite rounded-xl border border-white/5 hover:border-gold/30 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-sm">{job.title}</h4>
                    <span className={`text-[10px] px-2 py-1 rounded-full ${
                      job.status === 'open'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {job.status === 'open' ? 'Ativa' : 'Fechada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-offWhite/60">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {job.applications_count || 0} candidatos
                    </span>
                    <span>
                      {new Date(job.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <p className="text-sm text-offWhite/40">Aguarde candidatos interessados nas suas vagas</p>
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
                    <img 
                      src={conv.participantAvatar} 
                      alt={conv.participantName} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold text-white text-sm truncate">{conv.participantName}</h4>
                      <span className="text-[10px] text-offWhite/40 flex-shrink-0 ml-2">
                        {conv.lastMessageTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-offWhite/60 line-clamp-2">
                      {conv.lastMessage || 'Sem mensagens'}
                    </p>
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
      </div>

      {/* Create Job Modal */}
      {showCreateJobModal && (
        <CreateJobModal
          isOpen={showCreateJobModal}
          onClose={() => setShowCreateJobModal(false)}
          onSuccess={handleJobCreated}
        />
      )}

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
        onJobsClick={onNavigateToJobs}
        isCompany={true}
      />
    </div>
  );
};

export default CompanyDashboard;
