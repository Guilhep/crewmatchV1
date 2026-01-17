import React from 'react';
import { useAuth } from '../hooks/useAuth';
import CreateJobForm from '../components/jobs/CreateJobForm';
import { isProducer, isProducerProfile } from '../lib/jobs';
import { useEffect, useState } from 'react';

interface CreateJobProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const CreateJob: React.FC<CreateJobProps> = ({ onBack, onSuccess }) => {
  const { user, profile, loading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      // Se ainda está carregando autenticação, aguardar
      if (authLoading) {
        return;
      }

      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      // Se já temos o profile carregado, usar verificação síncrona (mais rápido)
      if (profile) {
        setIsAuthorized(isProducerProfile(profile));
        setLoading(false);
        return;
      }

      // Caso contrário, buscar do banco
      const producer = await isProducer(user.id);
      setIsAuthorized(producer);
      setLoading(false);
    };

    checkAuthorization();
  }, [user, profile, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-offWhite/80">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4">Acesso Negado</h2>
          <p className="text-offWhite/60 mb-6">
            Apenas produtores podem criar jobs. Se você é uma produtora, verifique se seu perfil está configurado corretamente.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy">
      <div className="container mx-auto py-8">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 text-offWhite/80 hover:text-white transition-colors"
        >
          ← Voltar
        </button>
        <CreateJobForm
          onSuccess={() => {
            onSuccess?.();
            onBack();
          }}
          onCancel={onBack}
        />
      </div>
    </div>
  );
};

export default CreateJob;
