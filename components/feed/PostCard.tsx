import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Trash2, Send } from 'lucide-react';
import { Post, toggleLike, fetchComments, createComment, deletePost } from '../../lib/feed';
import { useAuth } from '../../hooks/useAuth';

interface PostCardProps {
  post: Post;
  onPostDeleted?: () => void;
  onCommentAdded?: () => void;
  onStartConversation?: (userId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted, onCommentAdded, onStartConversation }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?.id === post.user_id;
  const authorName = post.author?.full_name || post.author?.name || 'Usuário';
  const authorAvatar = post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=1a1a1a&color=C6A663`;

  const handleLike = async () => {
    if (!user) return;

    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Otimistic update
    setIsLiked(!isLiked);
    setLikesCount(previousLiked ? likesCount - 1 : likesCount + 1);

    const result = await toggleLike(user.id, post.id);
    if (!result.success) {
      // Reverter em caso de erro
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
    } else {
      setIsLiked(result.isLiked);
    }
  };

  const handleShowComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }

    setLoadingComments(true);
    const fetchedComments = await fetchComments(post.id);
    setComments(fetchedComments);
    setShowComments(true);
    setLoadingComments(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || postingComment) return;

    setPostingComment(true);
    const result = await createComment(user.id, post.id, commentText);
    
    if (result.success && result.comment) {
      setComments([...comments, result.comment]);
      setCommentText('');
      onCommentAdded?.();
    }
    
    setPostingComment(false);
  };

  const handleDelete = async () => {
    if (!user || !isOwner) return;
    if (!confirm('Tem certeza que deseja deletar este post?')) return;

    setDeleting(true);
    const result = await deletePost(post.id, user.id);
    
    if (result.success) {
      onPostDeleted?.();
    } else {
      alert(result.error || 'Erro ao deletar post');
    }
    
    setDeleting(false);
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/feed/${post.id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      alert('Link copiado para a área de transferência!');
    } catch (err) {
      // Fallback para navegadores antigos
      const textArea = document.createElement('textarea');
      textArea.value = postUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copiado para a área de transferência!');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'agora';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
      } else {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
      }
    } catch {
      return 'há pouco tempo';
    }
  };

  return (
    <div className="bg-graphite border border-white/5 rounded-xl p-4 mb-4 hover:border-white/10 transition-colors">
      {/* Header do Post */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={authorAvatar}
          alt={authorName}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">{authorName}</h4>
              <p className="text-xs text-offWhite/50">{formatDate(post.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isOwner && user && onStartConversation && (
                <button
                  onClick={() => onStartConversation(post.user_id)}
                  className="p-1.5 text-offWhite/40 hover:text-gold transition-colors"
                  title="Enviar mensagem"
                >
                  <Send size={16} />
                </button>
              )}
              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1.5 text-offWhite/40 hover:text-red-400 transition-colors"
                  title="Deletar post"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo do Post */}
      <div className="mb-4">
        <p className="text-sm text-offWhite leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {/* Ações do Post */}
      <div className="flex items-center gap-6 pt-3 border-t border-white/5">
        {/* Botão Curtir */}
        <button
          onClick={handleLike}
          disabled={!user}
          className={`flex items-center gap-2 transition-colors ${
            isLiked
              ? 'text-red-500 hover:text-red-400'
              : 'text-offWhite/40 hover:text-red-500'
          }`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="text-xs font-medium">{likesCount}</span>
        </button>

        {/* Botão Comentar */}
        <button
          onClick={handleShowComments}
          className="flex items-center gap-2 text-offWhite/40 hover:text-gold transition-colors"
        >
          <MessageCircle size={18} />
          <span className="text-xs font-medium">{post.comments_count || 0}</span>
        </button>

        {/* Botão Compartilhar */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-offWhite/40 hover:text-gold transition-colors"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Seção de Comentários */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/5">
          {loadingComments ? (
            <div className="text-center py-4 text-offWhite/40 text-sm">Carregando comentários...</div>
          ) : (
            <>
              {/* Lista de Comentários */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-offWhite/40 text-center py-2">Nenhum comentário ainda</p>
                ) : (
                  comments.map((comment) => {
                    const commentAuthorName = comment.author?.full_name || comment.author?.name || 'Usuário';
                    const commentAuthorAvatar = comment.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(commentAuthorName)}&background=1a1a1a&color=C6A663`;
                    
                    return (
                      <div key={comment.id} className="flex gap-2">
                        <img
                          src={commentAuthorAvatar}
                          alt={commentAuthorName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 bg-navy/50 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-xs">{commentAuthorName}</span>
                            <span className="text-[10px] text-offWhite/40">{formatDate(comment.created_at)}</span>
                          </div>
                          <p className="text-xs text-offWhite/80 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Formulário de Novo Comentário */}
              {user && (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <img
                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}&background=1a1a1a&color=C6A663`}
                    alt="Você"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Escreva um comentário..."
                      maxLength={500}
                      className="flex-1 px-3 py-2 bg-navy/50 border border-white/10 rounded-lg text-white text-sm placeholder-offWhite/40 focus:outline-none focus:border-gold transition-colors"
                      disabled={postingComment}
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || postingComment}
                      className="px-4 py-2 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {postingComment ? '...' : 'Enviar'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
