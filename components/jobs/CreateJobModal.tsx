import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createJob } from '../../lib/jobs';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onJobCreated?: () => void; // Mantido para compatibilidade
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onSuccess, onJobCreated }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setError(null);
    setLoading(true);

    const result = await createJob(user.id, {
      title: title.trim(),
      description: description.trim(),
      budget: budget ? parseFloat(budget.replace(/[^\d,.-]/g, '').replace(',', '.')) : undefined,
      location: location.trim() || undefined,
    });

    if (result.success) {
      // Reset form
      setTitle('');
      setDescription('');
      setBudget('');
      setLocation('');
      // Chamar ambos callbacks se existirem
      onSuccess?.();
      onJobCreated?.();
    } else {
      setError(result.error || 'Erro ao criar vaga');
    }

    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setDescription('');
      setBudget('');
      setLocation('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy/95 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-navy border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Criar Nova Vaga</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-offWhite/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Título */}
          <div>
            <label htmlFor="title" className="block mb-2 text-sm font-medium text-offWhite/80">
              Título da Vaga *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 focus:border-gold focus:ring-gold/30 transition-all"
              placeholder="Ex: Diretor de Fotografia para Comercial"
              disabled={loading}
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-offWhite/80">
              Descrição *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={5000}
              rows={6}
              className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 focus:border-gold focus:ring-gold/30 transition-all resize-none"
              placeholder="Descreva a vaga, requisitos, cronograma..."
              disabled={loading}
            />
            <p className="mt-1 text-xs text-offWhite/40">{description.length}/5000 caracteres</p>
          </div>

          {/* Orçamento e Localização - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Orçamento */}
            <div>
              <label htmlFor="budget" className="block mb-2 text-sm font-medium text-offWhite/80">
                Orçamento (R$)
              </label>
              <input
                id="budget"
                type="text"
                value={budget}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d,.-]/g, '');
                  setBudget(value);
                }}
                maxLength={20}
                className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 focus:border-gold focus:ring-gold/30 transition-all"
                placeholder="Ex: 5000,00"
                disabled={loading}
              />
            </div>

            {/* Localização */}
            <div>
              <label htmlFor="location" className="block mb-2 text-sm font-medium text-offWhite/80">
                Localização
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={200}
                className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 focus:border-gold focus:ring-gold/30 transition-all"
                placeholder="Ex: São Paulo, SP"
                disabled={loading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-graphite text-white border border-white/10 rounded-lg hover:bg-graphite/80 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !description.trim()}
              className="flex-1 px-6 py-3 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Vaga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobModal;
