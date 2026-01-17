import { supabase } from './supabase';

export interface AuthError {
  message: string;
  field?: string;
}

export interface Profile {
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
  patent: 'bronze' | 'prata' | 'ouro' | null;
  quiz_score: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Login do usuário
 */
export async function login(email: string, password: string): Promise<{ error?: AuthError; profile?: Profile }> {
  if (!email || !password) {
    return {
      error: {
        message: 'Email e senha são obrigatórios',
      },
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        error: {
          message: error.message || 'Erro ao fazer login',
        },
      };
    }

    if (!data.user) {
      return {
        error: {
          message: 'Falha ao autenticar usuário',
        },
      };
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
    }

    return {
      profile: profile as Profile | undefined,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      error: {
        message: error.message || 'Erro inesperado ao fazer login',
      },
    };
  }
}

/**
 * Cadastro de novo usuário
 */
export async function signup(
  email: string,
  password: string,
  fullName: string,
  role: 'professional' | 'company'
): Promise<{ error?: AuthError; profile?: Profile }> {
  if (!email || !password || !fullName || !role) {
    return {
      error: {
        message: 'Todos os campos são obrigatórios',
      },
    };
  }

  // Validação de senha
  if (password.length < 6) {
    return {
      error: {
        message: 'A senha deve ter pelo menos 6 caracteres',
        field: 'password',
      },
    };
  }

  // Validar role
  if (role !== 'professional' && role !== 'company') {
    return {
      error: {
        message: 'Tipo de perfil inválido',
        field: 'role',
      },
    };
  }

  try {
    // Criar usuário no Supabase Auth
    // CRUCIAL: Passar full_name nos metadados para o trigger salvar corretamente
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,  // <-- CRUCIAL: O trigger usa este campo
          name: fullName,       // Fallback
          role: role,
        },
      },
    });

    if (error) {
      return {
        error: {
          message: error.message || 'Erro ao criar conta',
        },
      };
    }

    if (!data.user) {
      return {
        error: {
          message: 'Falha ao criar usuário',
        },
      };
    }

    // Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verificar se o perfil foi criado
    let profile: Profile | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    // Tentar buscar o perfil várias vezes (o trigger pode demorar)
    while (attempts < maxAttempts && !profile) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileData) {
        profile = profileData as Profile;
        break;
      }

      // Se não encontrou, aguardar mais um pouco e tentar novamente
      if (attempts < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      attempts++;
    }

    // Se o perfil não foi criado pelo trigger, criar manualmente
    if (!profile) {
      console.warn('Perfil não foi criado pelo trigger, criando manualmente...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          name: fullName,
          full_name: fullName,
          role: role,
          onboarding_completed: role === 'company' ? true : false,
          patent: 'bronze',
          quiz_score: 0,
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Erro ao criar perfil manualmente:', createError);
        return {
          error: {
            message: `Conta criada, mas houve um problema ao criar o perfil: ${createError.message}. Por favor, entre em contato com o suporte.`,
          },
        };
      }

      profile = newProfile as Profile;
    }

    return {
      profile,
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    return {
      error: {
        message: error.message || 'Erro inesperado ao criar conta',
      },
    };
  }
}

/**
 * Logout do usuário
 */
export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut();
    // Redirecionar será feito no componente
  } catch (error) {
    console.error('Signout error:', error);
  }
}

/**
 * Buscar perfil do usuário atual
 */
export async function getProfile(): Promise<Profile | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return profile as Profile;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
}

/**
 * Buscar sessão atual
 */
export async function getSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

