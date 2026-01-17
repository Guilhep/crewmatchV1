import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile, updateAvatar, updateCover, getExtendedProfile } from '../../lib/profile';
import { Camera, Upload, X } from 'lucide-react';

interface ProfileEditFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ onSave, onCancel }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_url || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null);
  const [coverPreview, setCoverPreview] = useState(profile?.cover_url || null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    setError(null);

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const result = await updateAvatar(user.id, file);
    if (result.success && result.url) {
      setAvatarPreview(result.url);
      await refreshProfile();
    } else {
      setError(result.error || 'Erro ao fazer upload do avatar');
    }

    setLoading(false);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    setError(null);

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const result = await updateCover(user.id, file);
    if (result.success && result.url) {
      setCoverPreview(result.url);
      await refreshProfile();
    } else {
      setError(result.error || 'Erro ao fazer upload da capa');
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateProfile(user.id, {
      full_name: fullName,
      bio: bio,
      portfolio_url: portfolioUrl,
    });

    if (result.success) {
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => {
        setSuccess(false);
        onSave?.();
      }, 2000);
    } else {
      setError(result.error || 'Erro ao salvar perfil');
    }

    setLoading(false);
  };

  if (!user || !profile) {
    return (
      <div className="p-8 text-center text-offWhite/60">
        Carregando perfil...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 rounded-lg overflow-hidden bg-graphite border border-white/10">
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/10 to-gold/5">
              <Camera className="w-12 h-12 text-gold/40" />
            </div>
          )}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-4 right-4 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-lg text-white hover:bg-black/90 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <Upload size={16} />
            {coverPreview ? 'Alterar Capa' : 'Adicionar Capa'}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
            disabled={loading}
          />
        </div>

        {/* Avatar */}
        <div className="flex items-start gap-6 -mt-16 ml-6 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-navy bg-graphite">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/20 to-gold/10">
                  <Camera className="w-8 h-8 text-gold/60" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-gold rounded-full text-navy hover:bg-goldHover transition-colors"
              disabled={loading}
            >
              <Camera size={16} />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              disabled={loading}
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 pt-8">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-offWhite mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold transition-colors"
              placeholder="Seu nome completo"
              disabled={loading}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-offWhite mb-2">
              Biografia
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold transition-colors resize-none"
              placeholder="Conte um pouco sobre você..."
              disabled={loading}
            />
          </div>

          {/* Portfolio URL */}
          <div>
            <label className="block text-sm font-medium text-offWhite mb-2">
              URL do Portfólio
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              className="w-full px-4 py-3 bg-graphite border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold transition-colors"
              placeholder="https://seuportfolio.com"
              disabled={loading}
            />
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
            Perfil atualizado com sucesso!
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
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditForm;
