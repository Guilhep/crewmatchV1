import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Briefcase, MapPin, DollarSign, Users, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchMyJobs, Job, deleteJob } from '../lib/jobs';
import MobileNav from '../components/MobileNav';
import CreateJobModal from '../components/jobs/CreateJobModal';
import JobDetailModal from '../components/jobs/JobDetailModal';

interface MyJobsProps {
  onBack: () => void;
  onNavigateToHome?: () => void;
  onNavigateToChat?: (participantId?: string) => void;
  onNavigateToProfile?: (userId?: string) => void;
  onNavigateToMatch?: () => void;
}

const MyJobs: React.FC<MyJobsProps> = ({
  onBack,
  onNavigateToHome,
  onNavigateToChat,
  onNavigateToProfile,
  onNavigateToMatch,
}) => {
  const { user, profile, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadJobs = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    const result = await fetchMyJobs(user.id);
    if (result.success && result.jobs) {
      setJobs(result.jobs);
    } else {
      setError(result.error || 'Erro ao carregar vagas');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
  }, [user?.id]);

  const handleDeleteJob = async (jobId: string) => {
    if (!user?.id) return;
    if (!confirm('Tem certeza que deseja deletar esta vaga?')) return;

    const result = await deleteJob(jobId, user.id);
    if (result.success) {
      await loadJobs();
    } else {
      alert(result.error || 'Erro ao deletar vaga');
    }
  };

  const handleJobCreated = () => {
    setShowCreateModal(false);
    loadJobs();
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'A combinar';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Defensive: Verificar loading primeiro, depois profile e account_type
  if (authLoading || loading) {
    return (
      <div className="flex flex-col h-screen bg-navy">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-offWhite/60">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Defensive: Verificar se profile existe e tem account_type antes de acessar
  if (!profile || !profile.account_type || profile.account_type !== 'company') {
    return (
      <div className="flex flex-col h-screen bg-navy">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-offWhite/60 mb-4">Acesso restrito a produtoras</p>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-navy overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-navy/90 backdrop-blur-sm border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 text-offWhite/60 hover:text-gold transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-white">Minhas Vagas</h1>
          <div className="w-9"></div> {/* Spacer para centralizar */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-offWhite/60">Carregando vagas...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadJobs}
                className="px-6 py-2 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Briefcase size={64} className="text-offWhite/20 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Nenhuma vaga criada</h2>
            <p className="text-offWhite/60 mb-6">Comece criando sua primeira vaga</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors"
            >
              Criar Primeira Vaga
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job)}
                className="bg-graphite border border-white/5 rounded-xl p-4 hover:border-gold/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-white flex-1">{job.title}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      job.status === 'open'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    {job.status === 'open' ? 'Aberta' : 'Fechada'}
                  </span>
                </div>

                <p className="text-sm text-offWhite/70 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-offWhite/50 mb-3">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {job.budget && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>{formatCurrency(job.budget)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{job.applications_count || 0} candidatos</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1 text-xs text-offWhite/40">
                    <Calendar size={12} />
                    <span>Criada em {formatDate(job.created_at)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteJob(job.id);
                    }}
                    className="px-3 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB - Criar Nova Vaga */}
      {jobs.length > 0 && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gold text-navy font-bold shadow-2xl shadow-gold/40 hover:bg-goldHover hover:scale-110 transition-all flex items-center justify-center z-50"
          aria-label="Criar nova vaga"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav
          activeTab="jobs"
          onHomeClick={onNavigateToHome || onBack}
          onFeedClick={() => {}}
          onChatClick={onNavigateToChat}
          onProfileClick={onNavigateToProfile}
          onMatchClick={onNavigateToMatch}
          onJobsClick={() => {}}
        />
      </div>

      {/* Modals */}
      <CreateJobModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onJobCreated={handleJobCreated}
      />

      {selectedJob && (
        <JobDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          onJobUpdated={loadJobs}
          onStartConversation={(participantId) => {
            setShowDetailModal(false);
            setSelectedJob(null);
            onNavigateToChat?.(participantId);
          }}
          onViewProfile={(userId) => {
            setShowDetailModal(false);
            setSelectedJob(null);
            onNavigateToProfile?.(userId);
          }}
        />
      )}
    </div>
  );
};

export default MyJobs;
