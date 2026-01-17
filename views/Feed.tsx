import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchPosts, Post } from '../lib/feed';
import NewPostForm from '../components/feed/NewPostForm';
import PostCard from '../components/feed/PostCard';
import MobileNav from '../components/MobileNav';

interface FeedProps {
  onBack?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToChat?: (participantId?: string) => void;
  onNavigateToProfile?: () => void;
  onNavigateToMatch?: () => void;
}

const Feed: React.FC<FeedProps> = ({
  onBack,
  onNavigateToHome,
  onNavigateToChat,
  onNavigateToProfile,
  onNavigateToMatch,
}) => {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadPosts = async (refresh: boolean = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const offset = refresh ? 0 : posts.length;
      const newPosts = await fetchPosts(20, offset);

      if (refresh) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
    } catch (err: any) {
      console.error('Erro ao carregar posts:', err);
      setError('Erro ao carregar posts. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadPosts(true);
    }
  }, [authLoading]);

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !refreshing) {
          loadPosts(false);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, refreshing]);

  const handlePostCreated = () => {
    loadPosts(true);
  };

  const handlePostDeleted = () => {
    loadPosts(true);
  };

  const handleCommentAdded = () => {
    // Recarregar posts para atualizar contagem de comentários
    loadPosts(true);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-offWhite/80">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full bg-navy"
      style={{ minHeight: '100dvh' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-navy/90 backdrop-blur-sm border-b border-white/5 px-4 py-3" style={{ flexShrink: 0 }}>
        <h1 className="text-xl font-bold font-serif text-white">Feed</h1>
      </div>

      {/* Conteúdo Principal */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: '16px',
          paddingBottom: '100px', // Espaço para a navbar
        }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Subtítulo */}
          <div className="mb-6">
            <p className="text-sm text-offWhite/60">Veja o que a comunidade está compartilhando</p>
          </div>

          {/* Formulário de Novo Post */}
          <NewPostForm onPostCreated={handlePostCreated} />

          {/* Lista de Posts */}
          {loading && posts.length === 0 ? (
            // Skeleton loading
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-graphite border border-white/5 rounded-xl p-4 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/10"></div>
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-white/10 rounded mb-2"></div>
                      <div className="h-3 w-16 bg-white/10 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  </div>
                  <div className="flex gap-6 pt-3 border-t border-white/5">
                    <div className="h-4 w-12 bg-white/10 rounded"></div>
                    <div className="h-4 w-12 bg-white/10 rounded"></div>
                    <div className="h-4 w-12 bg-white/10 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => loadPosts(true)}
                className="mt-3 px-4 py-2 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors text-sm"
              >
                Tentar Novamente
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-offWhite/60 mb-4">Nenhum post ainda</p>
              <p className="text-sm text-offWhite/40">Seja o primeiro a compartilhar algo!</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                  onCommentAdded={handleCommentAdded}
                  onStartConversation={(userId) => onNavigateToChat?.(userId)}
                />
              ))}
              {/* Trigger para infinite scroll */}
              <div ref={loadMoreRef} className="h-10"></div>
              {loading && posts.length > 0 && (
                <div className="text-center py-4">
                  <div className="inline-block w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div style={{ flexShrink: 0, zIndex: 100 }}>
        <MobileNav
          activeTab="feed"
          onHomeClick={onNavigateToHome}
          onFeedClick={() => {}}
          onChatClick={onNavigateToChat}
          onProfileClick={onNavigateToProfile}
          onMatchClick={onNavigateToMatch}
        />
      </div>
    </div>
  );
};

export default Feed;
