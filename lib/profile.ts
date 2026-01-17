import { supabase } from './supabase';
import { uploadAvatar, uploadCover } from './storage';

export interface ExtendedProfile {
  id: string;
  email: string;
  name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  portfolio_url: string | null;
  role: 'professional' | 'company' | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  full_name?: string;
  bio?: string;
  portfolio_url?: string;
  avatar_url?: string;
  cover_url?: string;
}

/**
 * Buscar perfil completo do usuário
 */
export async function getExtendedProfile(userId: string): Promise<ExtendedProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }

    return data as ExtendedProfile;
  } catch (error) {
    console.error('Erro inesperado ao buscar perfil:', error);
    return null;
  }
}

/**
 * Atualizar perfil do usuário
 */
export async function updateProfile(
  userId: string,
  data: UpdateProfileData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return {
        success: false,
        error: error.message || 'Erro ao atualizar perfil',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro inesperado ao atualizar perfil:', error);
    return {
      success: false,
      error: error.message || 'Erro inesperado ao atualizar perfil',
    };
  }
}

/**
 * Upload de avatar e atualização do perfil
 */
export async function updateAvatar(
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Fazer upload
    const uploadResult = await uploadAvatar(file, userId);

    if (uploadResult.error || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || 'Erro ao fazer upload',
      };
    }

    // Atualizar perfil com a nova URL
    const updateResult = await updateProfile(userId, {
      avatar_url: uploadResult.url,
    });

    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error || 'Erro ao atualizar perfil',
      };
    }

    return {
      success: true,
      url: uploadResult.url,
    };
  } catch (error: any) {
    console.error('Erro inesperado ao atualizar avatar:', error);
    return {
      success: false,
      error: error.message || 'Erro inesperado',
    };
  }
}

/**
 * Upload de cover e atualização do perfil
 */
export async function updateCover(
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Fazer upload
    const uploadResult = await uploadCover(file, userId);

    if (uploadResult.error || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || 'Erro ao fazer upload',
      };
    }

    // Atualizar perfil com a nova URL
    const updateResult = await updateProfile(userId, {
      cover_url: uploadResult.url,
    });

    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error || 'Erro ao atualizar perfil',
      };
    }

    return {
      success: true,
      url: uploadResult.url,
    };
  } catch (error: any) {
    console.error('Erro inesperado ao atualizar cover:', error);
    return {
      success: false,
      error: error.message || 'Erro inesperado',
    };
  }
}
