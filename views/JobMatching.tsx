import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Coffee } from 'lucide-react';
import confetti from 'canvas-confetti';
import MatchModal from '../components/MatchModal';
import JobMatchCard from '../components/JobMatchCard';
import MobileNav from '../components/MobileNav';
import { fetchOpenJobs, Job, applyToJob } from '../lib/jobs';
import { useAuth } from '../hooks/useAuth';
import { getOrCreateConversation } from '../lib/chat';

interface JobMatchingProps {
  onBack: () => void;
  onNavigateToHome?: () => void;
  onNavigateToChat?: (participantId?: string) => void;
  onNavigateToProfile?: () => void;
}

const JobMatching: React.FC<JobMatchingProps> = ({ 
  onBack,
  onNavigateToHome,
  onNavigateToChat,
  onNavigateToProfile,
}) => {
  const { user, profile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchedJob, setMatchedJob] = useState<Job | null>(null);

  // Carregar vagas abertas
  useEffect(() => {
    const loadJobs = async () => {
      if (!user?.id) {
        console.log('⚠️ Usuário não autenticado');
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('🔍 Buscando vagas abertas para usuário:', user.id);
      const result = await fetchOpenJobs(50, 0, user.id); // Buscar até 50 vagas, excluindo já aplicadas
      console.log('📊 Resultado da busca:', result);
      if (result.success && result.jobs) {
        console.log('✅ Vagas encontradas:', result.jobs.length);
        console.log('📋 Vagas:', result.jobs);
        setJobs(result.jobs);
      } else {
        console.log('❌ Erro ao buscar vagas:', result.error);
      }
      setLoading(false);
    };
    loadJobs();
  }, [user?.id]);

  // Verificações de segurança
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center pb-24" style={{ background: 'linear-gradient(180deg, #0A0F1C 0%, #111827 100%)' }}>
        <div className="w-16 h-16 mb-6 rounded-full bg-[#141A26] flex items-center justify-center border border-white/10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <span className="text-2xl">⏳</span>
          </motion.div>
        </div>
        <h2 className="font-serif text-2xl text-white mb-4">Carregando vagas...</h2>
        <MobileNav
          activeTab="explore"
          onHomeClick={onNavigateToHome || onBack}
          onFeedClick={() => {}}
          onChatClick={onNavigateToChat}
          onProfileClick={onNavigateToProfile}
          onMatchClick={() => {}}
        />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center pb-24" style={{ background: 'linear-gradient(180deg, #0A0F1C 0%, #111827 100%)' }}>
        <div className="w-20 h-20 mb-6 rounded-full bg-[#141A26] flex items-center justify-center border border-white/10">
          <Coffee size={40} className="text-gold" />
        </div>
        <h2 className="font-serif text-3xl text-white mb-4">Pegue um café ☕</h2>
        <p className="text-offWhite/60 max-w-md mb-8">
          Sem vagas por aqui no momento. Volte mais tarde para descobrir novas oportunidades incríveis!
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 text-sm font-bold text-white uppercase bg-gold rounded-lg hover:bg-goldHover transition-colors"
        >
          Voltar ao Dashboard
        </button>
        <MobileNav
          activeTab="explore"
          onHomeClick={onNavigateToHome || onBack}
          onFeedClick={() => {}}
          onChatClick={onNavigateToChat}
          onProfileClick={onNavigateToProfile}
          onMatchClick={() => {}}
        />
      </div>
    );
  }

  const currentJob = jobs[currentIndex];
  const nextJob = jobs[currentIndex + 1];
  const previousJob = jobs[currentIndex - 1];

  // Debug: verificar dados
  console.log('JobMatching Debug:', {
    currentIndex,
    totalJobs: jobs.length,
    currentJob: currentJob?.title,
    nextJob: nextJob?.title,
    previousJob: previousJob?.title
  });

  if (!currentJob) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center pb-24" style={{ background: 'linear-gradient(180deg, #0A0F1C 0%, #111827 100%)' }}>
        <h2 className="font-serif text-2xl text-white mb-4">Job não encontrado</h2>
        <button
          onClick={onBack}
          className="px-6 py-3 text-sm font-bold text-white uppercase bg-gold rounded-lg hover:bg-goldHover transition-colors"
        >
          Voltar
        </button>
        <MobileNav
          activeTab="explore"
          onHomeClick={onNavigateToHome || onBack}
          onFeedClick={() => {}}
          onChatClick={onNavigateToChat}
          onProfileClick={onNavigateToProfile}
          onMatchClick={() => {}}
        />
      </div>
    );
  }

  // Função para disparar confete
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Confete da esquerda
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      
      // Confete da direita
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Explosão central adicional
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#C6A663', '#FFD700', '#FFA500', '#FF6347', '#FF1493']
      });
    }, 100);
  };

  const handleSwipe = async (dir: 'left' | 'right') => {
    if (dir === 'right' && user?.id && currentJob) {
      // Disparar confete imediatamente
      triggerConfetti();
      
      // Aplicar à vaga
      console.log('📝 Aplicando à vaga:', currentJob.id);
      const result = await applyToJob(currentJob.id, user.id);
      
      if (result.success) {
        console.log('✅ Aplicação realizada com sucesso!');
        setMatchedJob(currentJob);
        setTimeout(() => {
          setShowMatchModal(true);
        }, 500);
      } else {
        console.error('❌ Erro ao aplicar à vaga:', result.error);
      }
    }

    setTimeout(() => {
      if (currentIndex < jobs.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 300);
  };

  const handleStartConversation = async () => {
    if (!user?.id || !matchedJob?.recruiter_id) {
      console.error('❌ Dados insuficientes para iniciar conversa');
      return;
    }

    console.log('💬 Criando conversa com:', matchedJob.recruiter_id);
    const result = await getOrCreateConversation(user.id, matchedJob.recruiter_id);
    
    if (result.success) {
      console.log('✅ Conversa criada/encontrada:', result.conversationId);
      // Navegar para a página de chat com o ID do recrutador
      onNavigateToChat?.(matchedJob.recruiter_id);
    } else {
      console.error('❌ Erro ao criar conversa:', result.error);
      // Mesmo com erro, tentar navegar para o chat
      onNavigateToChat?.(matchedJob.recruiter_id);
    }
  };

  if (currentIndex >= jobs.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center pb-24" style={{ background: 'linear-gradient(180deg, #0A0F1C 0%, #111827 100%)' }}>
        <div className="w-16 h-16 mb-6 rounded-full bg-[#141A26] flex items-center justify-center border border-white/10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <span className="text-2xl">✨</span>
            </motion.div>
          </motion.div>
        </div>
        <h2 className="font-serif text-3xl text-white mb-4">Você viu tudo por hoje</h2>
        <p className="text-[#9AA0A6] max-w-md mb-8">
          Não há mais vagas compatíveis com seu perfil no momento. Volte mais tarde para novas oportunidades.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 text-sm font-bold text-white uppercase bg-gold rounded-lg hover:bg-goldHover transition-colors"
        >
          Voltar ao Dashboard
        </button>
        <MobileNav
          activeTab="explore"
          onHomeClick={onNavigateToHome || onBack}
          onFeedClick={() => {}}
          onChatClick={onNavigateToChat}
          onProfileClick={onNavigateToProfile}
          onMatchClick={() => {}}
        />
      </div>
    );
  }

  return (
    <div 
      style={{ 
        height: '100dvh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#000',
        background: 'linear-gradient(180deg, #0A0F1C 0%, #111827 100%)'
      }}
    >
      {/* Back Button - Overlay no topo */}
      <div className="absolute top-0 left-0 right-0 z-[110] flex items-center justify-between p-4 pointer-events-none">
        <button
          onClick={onBack}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="w-10"></div>
      </div>

      {/* Área de Conteúdo - O Palco do Card */}
      <div 
        style={{ 
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          position: 'relative',
          minHeight: 0
        }}
      >
        {/* Container dos Cards com Peeking */}
        <div 
          style={{ 
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Card Anterior (Peeking à Esquerda) */}
          {previousJob && (
            <JobMatchCard
              job={previousJob}
              index={currentIndex - 1}
              currentIndex={currentIndex}
            />
          )}

          {/* Card Ativo */}
          {currentJob && (
            <AnimatePresence mode="wait">
              <JobMatchCard
                key={currentJob.id}
                job={currentJob}
                index={currentIndex}
                currentIndex={currentIndex}
                onSwipe={handleSwipe}
                drag={true}
              />
            </AnimatePresence>
          )}

          {/* Próximo Card (Peeking à Direita) */}
          {nextJob && (
            <JobMatchCard
              job={nextJob}
              index={currentIndex + 1}
              currentIndex={currentIndex}
            />
          )}

          {/* Fallback - Se nenhum card aparecer, mostrar mensagem */}
          {!currentJob && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-8">
              <p>Carregando jobs...</p>
            </div>
          )}
        </div>
      </div>

      {/* Match Modal */}
      <MatchModal
        isOpen={showMatchModal}
        onClose={() => {
          setShowMatchModal(false);
          setMatchedJob(null);
        }}
        jobTitle={matchedJob?.title || 'Projeto'}
        partnerName={matchedJob?.recruiter?.company_name || matchedJob?.recruiter?.name || 'Produtora'}
        partnerImage={matchedJob?.recruiter?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedJob?.recruiter?.company_name || matchedJob?.recruiter?.name || 'Produtora')}&background=C6A663&color=0A0F1C`}
        myImage={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || profile?.name || 'Você')}&background=C6A663&color=0A0F1C`}
        onStartConversation={handleStartConversation}
      />

      {/* Mobile Bottom Navigation Menu - Fixo na parte inferior */}
      <div style={{ flexShrink: 0, zIndex: 100 }}>
        <MobileNav
          activeTab="explore"
          onHomeClick={onNavigateToHome || onBack}
          onFeedClick={() => {}} // Feed será implementado
          onChatClick={onNavigateToChat}
          onProfileClick={onNavigateToProfile}
          onMatchClick={() => {}} // Já estamos na tela de match
        />
      </div>
    </div>
  );
};

export default JobMatching;
