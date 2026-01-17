import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createJob } from '../../lib/jobs';
import { Upload, X, Plus } from 'lucide-react';

interface CreateJobFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateJobForm: React.FC<CreateJobFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [dates, setDates] = useState('');
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [tags, setTags] = useState<string[]>(['']);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setImageFile(file);
  };

  const addRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const addTag = () => {
    setTags([...tags, '']);
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const updateTag = (index: number, value: string) => {
    const updated = [...tags];
    updated[index] = value;
    setTags(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validação
    if (!title.trim() || !description.trim()) {
      setError('Título e descrição são obrigatórios');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createJob(
      user.id,
      {
        title: title.trim(),
        description: description.trim(),
        budget: budget.trim() || undefined,
        location: location.trim() || undefined,
        dates: dates.trim() || undefined,
        requirements: requirements.filter((r) => r.trim() !== ''),
        tags: tags.filter((t) => t.trim() !== ''),
      },
      imageFile || undefined
    );

    if (result.success) {
      // Reset form
      setTitle('');
      setDescription('');
      setBudget('');
      setLocation('');
      setDates('');
      setRequirements(['']);
      setTags(['']);
      setImagePreview(null);
      setImageFile(null);
      
      onSuccess?.();
    } else {
      setError(result.error || 'Erro ao criar job');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Criar Novo Job</h2>
        <p className="text-offWhite/60">Preencha os detalhes do projeto</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-offWhite mb-2">
            Imagem do Projeto (Opcional)
          </label>
          <div className="relative h-48 rounded-lg overflow-hidden bg-graphite border border-white/10">
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                    if (imageInputRef.current) {
                      imageInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-black/90 transition-colors"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center hover:bg-white/5 transition-colors"
              >
                <Upload className="w-12 h-12 text-gold/40 mb-2" />
                <span className="text-offWhite/60">Clique para adicionar imagem</span>
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-offWhite mb-2">
            Título do Projeto *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold transition-colors"
            placeholder="Ex: Diretor de Fotografia para Comercial"
            required
            disabled={loading}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-offWhite mb-2">
            Descrição *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold transition-colors resize-none"
            placeholder="Descreva o projeto em detalhes..."
            required
            disabled={loading}
          />
        </div>

        {/* Budget, Location, Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-offWhite mb-2">
              Orçamento
            </label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold transition-colors"
              placeholder="R$ 10.000"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-offWhite mb-2">
              Localização
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold transition-colors"
              placeholder="São Paulo, SP"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-offWhite mb-2">
              Datas
            </label>
            <input
              type="text"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold transition-colors"
              placeholder="15-20 Jan 2024"
              disabled={loading}
            />
          </div>
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-offWhite mb-2">
            Requisitos
          </label>
          <div className="space-y-2">
            {requirements.map((req, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => updateRequirement(index, e.target.value)}
                  className="flex-1 px-4 py-2 bg-graphite border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold transition-colors"
                  placeholder={`Requisito ${index + 1}`}
                  disabled={loading}
                />
                {requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRequirement}
              className="flex items-center gap-2 px-4 py-2 text-gold hover:bg-gold/10 rounded-lg transition-colors"
              disabled={loading}
            >
              <Plus size={16} />
              Adicionar Requisito
            </button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-offWhite mb-2">
            Tags
          </label>
          <div className="space-y-2">
            {tags.map((tag, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => updateTag(index, e.target.value)}
                  className="flex-1 px-4 py-2 bg-graphite border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold transition-colors"
                  placeholder={`Tag ${index + 1}`}
                  disabled={loading}
                />
                {tags.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTag}
              className="flex items-center gap-2 px-4 py-2 text-gold hover:bg-gold/10 rounded-lg transition-colors"
              disabled={loading}
            >
              <Plus size={16} />
              Adicionar Tag
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-white/20 rounded-lg text-white hover:bg-white/5 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-3 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateJobForm;
