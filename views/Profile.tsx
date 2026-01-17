import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Settings, Camera, Edit2, User, Briefcase, Star, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import MobileNav from '../components/MobileNav';
import AvatarUploadModal from '../components/profile/AvatarUploadModal';
import ImageCropModal from '../components/profile/ImageCropModal';
import PortfolioCard from '../components/profile/PortfolioCard';
import PortfolioTab from '../components/profile/PortfolioTab';
import ReviewsTab from '../components/profile/ReviewsTab';
import ReviewCard from '../components/profile/ReviewCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { cn } from '../lib/utils';

interface ProfileProps {
  onBack: () => void;
  onNavigateToHome?: () => void;
  onNavigateToChat?: (participantId?: string) => void;
  onNavigateToProfile?: () => void;
  userId?: string; // Se não fornecido, mostra o próprio perfil
}

interface PortfolioItem {
  id: string;
  thumbnail_url: string;
  link_url: string;
  title?: string;
}

interface Review {
  id: string;
  projectName: string;
  feedback: string;
  rating: number;
  clientName?: string;
  date?: string;
}

const Profile: React.FC<ProfileProps> = ({
  onBack,
  onNavigateToHome,
  onNavigateToChat,
  onNavigateToProfile,
  userId,
}) => {
  const { user, profile: currentUserProfile, loading: profileLoading, refreshProfile, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Estados para edição
  const [activeTab, setActiveTab] = useState('about');
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Avatar e Cover
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  // Stats
  const [stats, setStats] = useState({
    projects: 0,
    followers: 0,
    following: 0,
  });

  // Carregar perfil
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const targetUserId = userId || user?.id;
        if (!targetUserId) {
          setLoading(false);
          return;
        }

        const isOwn = !userId || userId === user?.id;
        setIsOwnProfile(isOwn);

        // Buscar perfil
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .single();

        if (error) {
          console.error('Erro ao carregar perfil:', error);
          setLoading(false);
          return;
        }

        setProfile(profileData);
        setBio(profileData.bio || '');
        setPortfolio(profileData.portfolio || []);
        
        // Avatar - adicionar timestamp para forçar reload
        if (profileData.avatar_url) {
          setAvatarUrl(`${profileData.avatar_url}?t=${Date.now()}`);
        } else {
          setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=1C1F26&color=C6A663&size=200`);
        }

        // Cover Image - não usar placeholder, deixar vazio se não tiver
        if (profileData.cover_url) {
          setCoverUrl(`${profileData.cover_url}?t=${Date.now()}`);
        } else {
          setCoverUrl('');
        }

        // Buscar stats
        const projectsResult = await supabase
          .from('user_projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetUserId);
        const projectsCount = projectsResult.count || 0;

        // Buscar followers/following
        if (!isOwn) {
          const followResult = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user?.id)
            .eq('following_id', targetUserId)
            .single();
          
          setIsFollowing(!!followResult.data);
        }

        // Buscar contagem de followers/following
        const followersResult = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', targetUserId);
        const followersCount = followersResult.count || 0;

        const followingResult = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', targetUserId);
        const followingCount = followingResult.count || 0;

        // Mock reviews (substituir por dados reais quando disponível)
        const mockReviews: Review[] = [
          {
            id: '1',
            projectName: 'Comercial O2 Filmes',
            feedback: 'Trabalho excepcional! Profissionalismo e criatividade em cada detalhe. Recomendo fortemente.',
            rating: 5,
            clientName: 'O2 Filmes',
            date: '2024-01-15',
          },
          {
            id: '2',
            projectName: 'Videoclipe KondZilla',
            feedback: 'Excelente comunicação e entrega dentro do prazo. Resultado final superou expectativas.',
            rating: 4,
            clientName: 'KondZilla',
            date: '2024-02-20',
          },
        ];
        setReviews(mockReviews);

        // Mock portfolio com placeholders se vazio
        if (!profileData.portfolio || profileData.portfolio.length === 0) {
          const placeholderPortfolio: PortfolioItem[] = [
            {
              id: '1',
              thumbnail_url: 'https://picsum.photos/400/400?random=1',
              link_url: '',
              title: 'Projeto 1',
            },
            {
              id: '2',
              thumbnail_url: 'https://picsum.photos/400/400?random=2',
              link_url: '',
              title: 'Projeto 2',
            },
            {
              id: '3',
              thumbnail_url: 'https://picsum.photos/400/400?random=3',
              link_url: '',
              title: 'Projeto 3',
            },
          ];
          setPortfolio(placeholderPortfolio);
        }

        setStats({
          projects: projectsCount,
          followers: followersCount,
          following: followingCount,
        });
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, user]);

  // Upload de avatar
  const handleAvatarFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setShowAvatarModal(true);
    }
  };

  // Upload de cover
  const handleCoverFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setShowCoverModal(true);
    }
  };

  const handleAvatarSave = async (croppedImage: string) => {
    if (!user) {
      alert('Você precisa estar logado para alterar a foto.');
      return;
    }

    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

      const fileExt = 'jpg';
      const fileName = `${user.id}/avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log('Fazendo upload do avatar para:', filePath);
      console.log('Tamanho do arquivo:', blob.size, 'bytes');
      console.log('Tipo do arquivo:', blob.type);

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        alert(`Erro ao fazer upload da foto: ${uploadError.message}\n\nVerifique se o bucket 'profiles' está criado no Supabase Storage.`);
        return;
      }

      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
      const avatarUrlWithTimestamp = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(avatarUrlWithTimestamp);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar avatar:', updateError);
        alert(`Erro ao salvar URL da foto: ${updateError.message}`);
      } else {
        await refreshProfile();
        // Fechar modal
        setShowAvatarModal(false);
        setAvatarFile(null);
        alert('Foto de perfil atualizada com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao processar avatar:', error);
      alert(`Erro ao salvar foto: ${error.message || 'Erro desconhecido'}`);
    }
  };

  // Salvar cover após crop
  const handleCoverSave = async (croppedImage: string) => {
    if (!user) {
      alert('Você precisa estar logado para alterar a capa.');
      return;
    }

    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });

      const fileExt = 'jpg';
      const fileName = `${user.id}/cover.${fileExt}`;
      const filePath = `covers/${fileName}`;

      console.log('Fazendo upload da capa para:', filePath);
      console.log('Tamanho do arquivo:', blob.size, 'bytes');
      console.log('Tipo do arquivo:', blob.type);

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        alert(`Erro ao fazer upload da capa: ${uploadError.message}\n\nVerifique se o bucket 'profiles' está criado no Supabase Storage.`);
        return;
      }

      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
      const coverUrlWithTimestamp = `${data.publicUrl}?t=${Date.now()}`;
      setCoverUrl(coverUrlWithTimestamp);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar capa:', updateError);
        alert(`Erro ao salvar URL da capa: ${updateError.message}`);
      } else {
        await refreshProfile();
        // Fechar modal
        setShowCoverModal(false);
        setCoverFile(null);
        alert('Foto de capa atualizada com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao processar capa:', error);
      alert(`Erro ao salvar capa: ${error.message || 'Erro desconhecido'}`);
    }
  };

  // Portfolio
  const handlePortfolioThumbnailUpload = async (slotIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/portfolio-${slotIndex}.${fileExt}`;
      const filePath = `portfolio/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        alert('Erro ao fazer upload da imagem.');
        return;
      }

      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
      const updatedPortfolio = [...portfolio];
      if (updatedPortfolio[slotIndex]) {
        updatedPortfolio[slotIndex].thumbnail_url = data.publicUrl;
      } else {
        updatedPortfolio[slotIndex] = {
          id: `portfolio-${slotIndex}`,
          thumbnail_url: data.publicUrl,
          link_url: '',
          title: `Projeto ${slotIndex + 1}`,
        };
      }
      setPortfolio(updatedPortfolio);
    } catch (error) {
      console.error('Erro ao processar upload:', error);
      alert('Erro ao fazer upload da imagem.');
    }
  };

  const handlePortfolioLinkChange = (slotIndex: number, link: string) => {
    const updatedPortfolio = [...portfolio];
    if (updatedPortfolio[slotIndex]) {
      updatedPortfolio[slotIndex].link_url = link;
    } else {
      updatedPortfolio[slotIndex] = {
        id: `portfolio-${slotIndex}`,
        thumbnail_url: '',
        link_url: link,
        title: `Projeto ${slotIndex + 1}`,
      };
    }
    setPortfolio(updatedPortfolio);
  };

  // Salvar perfil
  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio,
          portfolio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao salvar perfil:', error);
        alert('Erro ao salvar perfil.');
      } else {
        await refreshProfile();
        setIsEditingBio(false);
        alert('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil.');
    }
  };

  // Follow/Unfollow
  const handleFollowToggle = async () => {
    if (!user || !userId || isOwnProfile) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (!error) {
          setIsFollowing(false);
          setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
        }
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
          });

        if (!error) {
          setIsFollowing(true);
          setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
        }
      }
    } catch (error) {
      console.error('Erro ao seguir/deixar de seguir:', error);
    }
  };

  const getUserName = () => {
    if (loading) return 'Carregando...';
    if (profile?.full_name) return profile.full_name;
    if (profile?.name) return profile.name;
    return 'Usuário';
  };

  const getUserRole = () => {
    if (profile?.main_skill) return profile.main_skill;
    if (profile?.role === 'professional') {
      if (profile?.level_id) {
        const levelMap: { [key: string]: string } = {
          silver: 'Profissional Sênior',
          bronze: 'Profissional',
          trainee: 'Iniciante',
        };
        return levelMap[profile.level_id] || 'Profissional';
      }
      return 'Profissional';
    }
    if (profile?.role === 'company') {
      return 'Produtora';
    }
    return 'Usuário';
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-navy">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-offWhite/60">Carregando perfil...</p>
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
          <h1 className="text-lg font-semibold text-white">Perfil</h1>
          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <>
                <button
                  onClick={handleSaveProfile}
                  className="p-2 text-offWhite/60 hover:text-gold transition-colors"
                  aria-label="Salvar perfil"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Deseja realmente encerrar a sessão?')) {
                      await signOut();
                    }
                  }}
                  className="p-2 text-offWhite/60 hover:text-red-400 transition-colors"
                  aria-label="Encerrar sessão"
                  title="Encerrar sessão"
                >
                  <LogOut size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Cover Image */}
        <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-graphite to-navy overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Capa do perfil"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                console.error('Erro ao carregar capa');
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-offWhite/30 text-sm">
                {isOwnProfile ? 'Clique no ícone para adicionar uma foto de capa' : 'Sem foto de capa'}
              </p>
            </div>
          )}
          {isOwnProfile && (
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border-2 border-gold/30 flex items-center justify-center text-gold shadow-xl hover:bg-black/80 hover:border-gold hover:scale-110 transition-all duration-300 group"
              aria-label="Alterar capa"
            >
              <Camera
                size={16}
                strokeWidth={2.5}
                className="group-hover:scale-110 transition-transform duration-300"
              />
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverFileSelect}
            className="hidden"
          />
          {/* Cover Crop Modal */}
          <ImageCropModal
            isOpen={showCoverModal}
            onClose={() => {
              setShowCoverModal(false);
              setCoverFile(null);
            }}
            onSave={handleCoverSave}
            imageFile={coverFile || undefined}
            aspect={16 / 9}
            cropShape="rect"
            title="Ajustar Foto de Capa"
          />
        </div>

        {/* Profile Info Section */}
        <div className="relative px-4 -mt-16 mb-6">
          {/* Avatar com overlap */}
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 rounded-full bg-graphite border-4 border-navy overflow-hidden shadow-xl">
              <img
                src={avatarUrl}
                alt={getUserName()}
                className="w-full h-full object-cover object-center"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                onError={(e) => {
                  console.error('Erro ao carregar avatar, usando fallback');
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName())}&background=1C1F26&color=C6A663&size=200`;
                }}
              />
            </div>
            {isOwnProfile && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border-2 border-gold/30 flex items-center justify-center text-gold shadow-xl hover:bg-black/80 hover:border-gold hover:scale-110 transition-all duration-300 group"
                aria-label="Alterar foto"
              >
                <Edit2 
                  size={16} 
                  strokeWidth={2.5}
                  className="group-hover:scale-110 transition-transform duration-300"
                />
              </button>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileSelect}
              className="hidden"
            />
          </div>

          {/* Hierarquia de Informações */}
          <div className="space-y-3 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white font-serif">{getUserName()}</h2>
                <p className="text-base text-gold font-medium mt-1">{getUserRole()}</p>
              </div>
              {!isOwnProfile && (
                <button
                  onClick={handleFollowToggle}
                  className={cn(
                    'px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg',
                    isFollowing
                      ? 'bg-graphite text-white border border-white/10 hover:bg-graphite/80'
                      : 'bg-gold text-navy hover:bg-goldHover shadow-gold/20 hover:shadow-gold/30'
                  )}
                >
                  {isFollowing ? 'Seguindo' : 'Seguir'}
                </button>
              )}
            </div>
            {bio && (
              <p className="text-sm text-offWhite/70 leading-relaxed max-w-2xl">
                {bio}
              </p>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-around py-4 border-t border-white/10">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">{stats.projects}</span>
              <span className="text-xs text-offWhite/50 uppercase tracking-wider">Projetos</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">{stats.followers}</span>
              <span className="text-xs text-offWhite/50 uppercase tracking-wider">Seguidores</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">{stats.following}</span>
              <span className="text-xs text-offWhite/50 uppercase tracking-wider">Seguindo</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
          <TabsList>
            <TabsTrigger value="about" icon={<User size={16} />}>
              Sobre
            </TabsTrigger>
            <TabsTrigger value="portfolio" icon={<Briefcase size={16} />}>
              Portfólio
            </TabsTrigger>
            <TabsTrigger value="reviews" icon={<Star size={16} />}>
              Avaliações
            </TabsTrigger>
          </TabsList>

          {/* Aba Sobre */}
          <TabsContent value="about" className="mt-8 relative">
            <div className="space-y-6">
              <div className="relative">
                {isOwnProfile && !isEditingBio && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="absolute -top-2 -right-2 p-2 bg-gold/10 hover:bg-gold/20 rounded-full text-gold transition-colors"
                    aria-label="Editar sobre"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                {isOwnProfile && isEditingBio ? (
                  <div className="space-y-4">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Conte um pouco sobre você..."
                      rows={6}
                      maxLength={500}
                      className="w-full bg-graphite border border-white/10 rounded-xl px-4 py-3 text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          handleSaveProfile();
                        }}
                        className="px-6 py-2.5 bg-gold text-navy font-semibold rounded-lg hover:bg-goldHover transition-colors"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingBio(false);
                          setBio(profile?.bio || '');
                        }}
                        className="px-6 py-2.5 bg-graphite text-white border border-white/10 rounded-lg hover:bg-graphite/80 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-graphite border border-white/5 rounded-xl p-6">
                    <p className="text-offWhite/80 leading-relaxed whitespace-pre-wrap">
                      {bio || 'Nenhuma biografia disponível.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Aba Portfólio */}
          <TabsContent value="portfolio" className="mt-8">
            <PortfolioTab
              projects={portfolio.map((item) => ({
                id: item.id || '',
                title: item.title || 'Projeto',
                imageUrl: item.thumbnail_url || 'https://via.placeholder.com/400x400/1C1F26/C6A663?text=Projeto',
                link: item.link_url || '',
              }))}
              isOwnProfile={isOwnProfile}
              onAddProject={() => {
                // Handler para adicionar novo projeto
                const newIndex = portfolio.length;
                portfolioInputRefs.current[`thumbnail-${newIndex}`]?.click();
              }}
            />
          </TabsContent>

          {/* Aba Avaliações */}
          <TabsContent value="reviews" className="mt-8">
            <ReviewsTab reviews={reviews} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav
          activeTab="profile"
          onHomeClick={onNavigateToHome || onBack}
          onFeedClick={() => {}}
          onChatClick={onNavigateToChat}
          onProfileClick={() => {}}
          onMatchClick={() => {}}
        />
      </div>

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => {
          setShowAvatarModal(false);
          setAvatarFile(null);
        }}
        onSave={handleAvatarSave}
        imageFile={avatarFile || undefined}
      />
    </div>
  );
};

export default Profile;
