import { supabase } from './supabase-client';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreatePostData {
  content: string;
}

/**
 * Buscar posts do feed (com informações do autor, likes e comentários)
 */
export async function fetchPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
  try {
    // Buscar posts
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao buscar posts:', error);
      return [];
    }

    if (!posts || posts.length === 0) return [];

    // Buscar informações dos autores e contagens
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    const postsWithCounts = await Promise.all(
      posts.map(async (post: any) => {
        // Buscar perfil do autor
        const { data: author } = await supabase
          .from('profiles')
          .select('id, name, full_name, avatar_url')
          .eq('id', post.user_id)
          .single();

        // Contar likes
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Contar comentários
        const { count: commentsCount } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Verificar se o usuário atual curtiu o post
        let isLiked = false;
        if (currentUserId) {
          const { data: like } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', currentUserId)
            .maybeSingle();
          isLiked = !!like;
        }

        return {
          ...post,
          author: author || null,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          is_liked: isLiked,
        } as Post;
      })
    );

    return postsWithCounts;
  } catch (error) {
    console.error('Erro inesperado ao buscar posts:', error);
    return [];
  }
}

/**
 * Criar novo post
 */
export async function createPost(
  userId: string,
  data: CreatePostData
): Promise<{ success: boolean; post?: Post; error?: string }> {
  try {
    if (!data.content.trim()) {
      return {
        success: false,
        error: 'O conteúdo do post não pode estar vazio',
      };
    }

    if (data.content.length > 280) {
      return {
        success: false,
        error: 'O post deve ter no máximo 280 caracteres',
      };
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: data.content.trim(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao criar post:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar post',
      };
    }

    // Buscar perfil do autor
    const { data: author } = await supabase
      .from('profiles')
      .select('id, name, full_name, avatar_url')
      .eq('id', userId)
      .single();

    return {
      success: true,
      post: {
        ...post,
        author: author || null,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
      } as Post,
    };
  } catch (error: any) {
    console.error('Erro inesperado ao criar post:', error);
    return {
      success: false,
      error: error.message || 'Erro inesperado ao criar post',
    };
  }
}

/**
 * Toggle like em um post (curtir/descurtir)
 */
export async function toggleLike(
  userId: string,
  postId: string
): Promise<{ success: boolean; isLiked: boolean; error?: string }> {
  try {
    // Verificar se já curtiu
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (existingLike) {
      // Descurtir
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) {
        console.error('Erro ao remover like:', error);
        return {
          success: false,
          isLiked: true,
          error: error.message || 'Erro ao remover like',
        };
      }

      return {
        success: true,
        isLiked: false,
      };
    } else {
      // Curtir
      const { error } = await supabase
        .from('post_likes')
        .insert({
          user_id: userId,
          post_id: postId,
        });

      if (error) {
        console.error('Erro ao adicionar like:', error);
        return {
          success: false,
          isLiked: false,
          error: error.message || 'Erro ao curtir post',
        };
      }

      return {
        success: true,
        isLiked: true,
      };
    }
  } catch (error: any) {
    console.error('Erro inesperado ao toggle like:', error);
    return {
      success: false,
      isLiked: false,
      error: error.message || 'Erro inesperado',
    };
  }
}

/**
 * Buscar comentários de um post
 */
export async function fetchComments(postId: string): Promise<Comment[]> {
  try {
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar comentários:', error);
      return [];
    }

    if (!comments || comments.length === 0) return [];

    // Buscar informações dos autores dos comentários
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment: any) => {
        const { data: author } = await supabase
          .from('profiles')
          .select('id, name, full_name, avatar_url')
          .eq('id', comment.user_id)
          .single();

        return {
          ...comment,
          author: author || null,
        } as Comment;
      })
    );

    return commentsWithAuthors;
  } catch (error) {
    console.error('Erro inesperado ao buscar comentários:', error);
    return [];
  }
}

/**
 * Criar comentário em um post
 */
export async function createComment(
  userId: string,
  postId: string,
  content: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  try {
    if (!content.trim()) {
      return {
        success: false,
        error: 'O comentário não pode estar vazio',
      };
    }

    if (content.length > 500) {
      return {
        success: false,
        error: 'O comentário deve ter no máximo 500 caracteres',
      };
    }

    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        user_id: userId,
        post_id: postId,
        content: content.trim(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao criar comentário:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar comentário',
      };
    }

    // Buscar perfil do autor
    const { data: author } = await supabase
      .from('profiles')
      .select('id, name, full_name, avatar_url')
      .eq('id', userId)
      .single();

    return {
      success: true,
      comment: {
        ...comment,
        author: author || null,
      } as Comment,
    };
  } catch (error: any) {
    console.error('Erro inesperado ao criar comentário:', error);
    return {
      success: false,
      error: error.message || 'Erro inesperado ao criar comentário',
    };
  }
}

/**
 * Deletar post
 */
export async function deletePost(
  postId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se o post pertence ao usuário
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post || post.user_id !== userId) {
      return {
        success: false,
        error: 'Post não encontrado ou você não tem permissão para deletá-lo',
      };
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Erro ao deletar post:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar post',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao deletar post:', error);
    return {
      success: false,
      error: error.message || 'Erro inesperado ao deletar post',
    };
  }
}
