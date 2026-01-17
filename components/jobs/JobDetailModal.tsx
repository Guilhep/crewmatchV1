import React, { useState, useEffect } from 'react';
import { X, User, MapPin, DollarSign, MessageCircle } from 'lucide-react';
import { Job, fetchJobApplications, JobApplication } from '../../lib/jobs';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onJobUpdated: () => void;
  onStartConversation: (participantId: string) => void;
  onViewProfile?: (userId: string) => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({
  isOpen,
  onClose,
  job,
  onJobUpdated,
  onStartConversation,
  onViewProfile,
}) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && job.id) {
      loadApplications();
    }
  }, [isOpen, job.id]);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchJobApplications(job.id);
    if (result.success && result.applications) {
      setApplications(result.applications);
    } else {
      setError(result.error || 'Erro ao carregar candidaturas');
    }

    setLoading(false);
  };

  const handleContact = async (applicantId: string) => {
    // Criar ou obter conversa e navegar para o chat
    onStartConversation(applicantId);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy/95 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-navy border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-navy/95 backdrop-blur-sm border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-offWhite/50">
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
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-offWhite/60 hover:text-white transition-colors ml-4"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Descrição */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-offWhite/80 mb-2">Descrição</h3>
            <p className="text-sm text-offWhite/70 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {/* Candidatos */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              Candidatos ({applications.length})
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-offWhite/60">Carregando candidatos...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={loadApplications}
                  className="px-4 py-2 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors text-sm"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 bg-graphite/50 rounded-xl border border-white/5">
                <User size={48} className="text-offWhite/20 mx-auto mb-4" />
                <p className="text-offWhite/60">Nenhum candidato ainda</p>
                <p className="text-sm text-offWhite/40 mt-2">Compartilhe a vaga para receber candidaturas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((application) => {
                  const applicant = application.applicant;
                  const applicantName = applicant?.full_name || applicant?.name || 'Usuário';
                  const applicantAvatar =
                    applicant?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(applicantName)}&background=1a1a1a&color=C6A663`;

                  return (
                    <div
                      key={application.id}
                      className="bg-graphite border border-white/5 rounded-xl p-4 hover:border-gold/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={applicantAvatar}
                          alt={applicantName}
                          onClick={() => onViewProfile?.(application.applicant_id)}
                          className="w-12 h-12 rounded-full object-cover object-center flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-gold transition-all"
                          title="Ver perfil"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 
                            onClick={() => onViewProfile?.(application.applicant_id)}
                            className="font-bold text-white mb-1 cursor-pointer hover:text-gold transition-colors"
                            title="Ver perfil"
                          >
                            {applicantName}
                          </h4>
                          {applicant?.main_skill && (
                            <p className="text-sm text-gold mb-2">{applicant.main_skill}</p>
                          )}
                          {applicant?.level_id && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold bg-gold/10 text-gold rounded mb-2">
                              {applicant.level_id === 'silver'
                                ? 'Silver'
                                : applicant.level_id === 'bronze'
                                ? 'Bronze'
                                : 'Trainee'}
                            </span>
                          )}
                          <p className="text-xs text-offWhite/40 mt-2">
                            Candidatou-se em {formatDate(application.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleContact(application.applicant_id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors text-sm flex-shrink-0"
                        >
                          <MessageCircle size={16} />
                          Entrar em Contato
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
