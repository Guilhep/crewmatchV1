import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { createPost } from '../../lib/feed';
import { useAuth } from '../../hooks/useAuth';

interface NewPostFormProps {
  onPostCreated?: () => void;
}

const NewPostForm: React.FC<NewPostFormProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxLength = 280;
  const remainingChars = maxLength - content.length;
  const isNearLimit = remainingChars < 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || posting) return;

    setPosting(true);
    setError(null);

    const result = await createPost(user.id, { content });

    if (result.success) {
      setContent('');
      onPostCreated?.();
    } else {
      setError(result.error || 'Erro ao criar post');
    }

    setPosting(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-graphite border border-white/5 rounded-xl p-4 mb-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <img
            src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}&background=1a1a1a&color=C6A663`}
            alt="Você"
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= maxLength) {
                  setContent(e.target.value);
                }
              }}
              placeholder="O que está acontecendo?"
              rows={3}
              className="w-full px-4 py-3 bg-navy/50 border border-white/10 rounded-lg text-white placeholder-offWhite/40 focus:outline-none focus:border-gold transition-colors resize-none text-sm"
              disabled={posting}
            />
            {error && (
              <p className="text-xs text-red-400 mt-1">{error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className={`text-xs ${isNearLimit ? 'text-red-400' : 'text-offWhite/40'}`}>
            {remainingChars} caracteres restantes
          </div>
          <button
            type="submit"
            disabled={!content.trim() || posting || content.length > maxLength}
            className="flex items-center gap-2 px-6 py-2.5 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Send size={16} />
            {posting ? 'Postando...' : 'Postar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPostForm;
