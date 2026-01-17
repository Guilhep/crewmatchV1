import { supabase } from './supabase';

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload de avatar para Supabase Storage
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return {
        url: null,
        error: 'O arquivo deve ser uma imagem',
      };
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        url: null,
        error: 'A imagem deve ter no máximo 5MB',
      };
    }

    // Criar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Substituir se já existir
      });

    if (error) {
      console.error('Erro no upload:', error);
      return {
        url: null,
        error: error.message || 'Erro ao fazer upload da imagem',
      };
    }

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    return {
      url: publicUrl,
      error: null,
    };
  } catch (error: any) {
    console.error('Erro inesperado no upload:', error);
    return {
      url: null,
      error: error.message || 'Erro inesperado ao fazer upload',
    };
  }
}

/**
 * Upload de cover para Supabase Storage
 */
export async function uploadCover(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return {
        url: null,
        error: 'O arquivo deve ser uma imagem',
      };
    }

    // Validar tamanho (máximo 10MB para covers)
    if (file.size > 10 * 1024 * 1024) {
      return {
        url: null,
        error: 'A imagem deve ter no máximo 10MB',
      };
    }

    // Criar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-cover-${Date.now()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('covers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Erro no upload:', error);
      return {
        url: null,
        error: error.message || 'Erro ao fazer upload da imagem',
      };
    }

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from('covers').getPublicUrl(filePath);

    return {
      url: publicUrl,
      error: null,
    };
  } catch (error: any) {
    console.error('Erro inesperado no upload:', error);
    return {
      url: null,
      error: error.message || 'Erro inesperado ao fazer upload',
    };
  }
}

/**
 * Upload de imagem de job para Supabase Storage
 */
export async function uploadJobImage(
  file: File,
  jobId: string
): Promise<UploadResult> {
  try {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return {
        url: null,
        error: 'O arquivo deve ser uma imagem',
      };
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        url: null,
        error: 'A imagem deve ter no máximo 10MB',
      };
    }

    // Criar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${jobId}-${Date.now()}.${fileExt}`;
    const filePath = `job-images/${fileName}`;

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('job-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Erro no upload:', error);
      return {
        url: null,
        error: error.message || 'Erro ao fazer upload da imagem',
      };
    }

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from('job-images').getPublicUrl(filePath);

    return {
      url: publicUrl,
      error: null,
    };
  } catch (error: any) {
    console.error('Erro inesperado no upload:', error);
    return {
      url: null,
      error: error.message || 'Erro inesperado ao fazer upload',
    };
  }
}

/**
 * Deletar imagem do storage
 */
export async function deleteImage(bucket: string, filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    
    if (error) {
      console.error('Erro ao deletar imagem:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro inesperado ao deletar imagem:', error);
    return false;
  }
}
