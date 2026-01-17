import { supabase } from './supabase-client';

// Tipos para o banco de dados
export interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  description: string;
  budget: number | null;
  location: string | null;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  recruiter?: {
    id: string;
    name?: string;
    company_name?: string;
    avatar_url?: string;
  };
  applications_count?: number;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  created_at: string;
  applicant?: {
    id: string;
    name?: string;
    full_name?: string;
    avatar_url?: string;
    main_skill?: string;
    level_id?: string;
  };
  job?: {
    id: string;
    title: string;
    recruiter_id: string;
  };
}

/**
 * Busca todas as vagas criadas pelo recrutador
 */
export async function fetchMyJobs(
  recruiterId: string
): Promise<{ success: boolean; jobs?: Job[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id,
        recruiter_id,
        title,
        description,
        budget,
        location,
        status,
        created_at,
        updated_at
      `)
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Buscar contagem de candidaturas para cada vaga
    const jobsWithCounts = await Promise.all(
      (data || []).map(async (job) => {
        const { count } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id);

        return {
          ...job,
          applications_count: count || 0,
        } as Job;
      })
    );

    return { success: true, jobs: jobsWithCounts };
  } catch (error: any) {
    console.error('Erro ao buscar vagas:', error);
    return { success: false, error: error.message || 'Erro ao buscar vagas' };
  }
}

/**
 * Busca uma vaga específica
 */
export async function fetchJob(
  jobId: string
): Promise<{ success: boolean; job?: Job; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id,
        recruiter_id,
        title,
        description,
        budget,
        location,
        status,
        created_at,
        updated_at,
        recruiter:profiles!jobs_recruiter_id_fkey(id, name, company_name, avatar_url)
      `)
      .eq('id', jobId)
      .single();

    if (error) throw error;

    return { success: true, job: data as Job };
  } catch (error: any) {
    console.error('Erro ao buscar vaga:', error);
    return { success: false, error: error.message || 'Erro ao buscar vaga' };
  }
}

/**
 * Cria uma nova vaga
 */
export async function createJob(
  recruiterId: string,
  jobData: {
    title: string;
    description: string;
    budget?: number;
    location?: string;
  }
): Promise<{ success: boolean; job?: Job; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        recruiter_id: recruiterId,
        title: jobData.title,
        description: jobData.description,
        budget: jobData.budget || null,
        location: jobData.location || null,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, job: data as Job };
  } catch (error: any) {
    console.error('Erro ao criar vaga:', error);
    return { success: false, error: error.message || 'Erro ao criar vaga' };
  }
}

/**
 * Atualiza uma vaga
 */
export async function updateJob(
  jobId: string,
  recruiterId: string,
  jobData: {
    title?: string;
    description?: string;
    budget?: number;
    location?: string;
    status?: 'open' | 'closed';
  }
): Promise<{ success: boolean; job?: Job; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        ...jobData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('recruiter_id', recruiterId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, job: data as Job };
  } catch (error: any) {
    console.error('Erro ao atualizar vaga:', error);
    return { success: false, error: error.message || 'Erro ao atualizar vaga' };
  }
}

/**
 * Deleta uma vaga
 */
export async function deleteJob(
  jobId: string,
  recruiterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('recruiter_id', recruiterId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar vaga:', error);
    return { success: false, error: error.message || 'Erro ao deletar vaga' };
  }
}

/**
 * Busca candidaturas de uma vaga
 */
export async function fetchJobApplications(
  jobId: string
): Promise<{ success: boolean; applications?: JobApplication[]; error?: string }> {
  try {
    console.log('🔍 Buscando candidaturas para vaga:', jobId);
    
    // Buscar aplicações
    const { data: applicationsData, error: applicationsError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    console.log('📋 Aplicações encontradas:', applicationsData);

    if (applicationsError) {
      console.error('❌ Erro ao buscar aplicações:', applicationsError);
      throw applicationsError;
    }

    if (!applicationsData || applicationsData.length === 0) {
      console.log('ℹ️ Nenhuma candidatura encontrada');
      return { success: true, applications: [] };
    }

    // Buscar dados dos candidatos
    const applicantIds = applicationsData.map(app => app.applicant_id);
    const { data: applicantsData, error: applicantsError } = await supabase
      .from('profiles')
      .select('id, name, full_name, avatar_url, main_skill, level_id')
      .in('id', applicantIds);

    console.log('👥 Candidatos encontrados:', applicantsData);

    if (applicantsError) {
      console.warn('⚠️ Erro ao buscar candidatos:', applicantsError);
    }

    // Combinar os dados
    const applicationsWithApplicants = applicationsData.map(app => ({
      ...app,
      applicant: applicantsData?.find(a => a.id === app.applicant_id) || undefined
    }));

    console.log('✅ Candidaturas com dados:', applicationsWithApplicants.length);

    return { success: true, applications: applicationsWithApplicants as JobApplication[] };
  } catch (error: any) {
    console.error('❌ Erro ao buscar candidaturas:', error);
    return { success: false, error: error.message || 'Erro ao buscar candidaturas' };
  }
}

/**
 * Busca vagas abertas (para profissionais verem)
 * @param limit - Número máximo de vagas a retornar
 * @param offset - Offset para paginação
 * @param excludeAppliedByUserId - ID do usuário para excluir vagas já aplicadas
 */
export async function fetchOpenJobs(
  limit: number = 20,
  offset: number = 0,
  excludeAppliedByUserId?: string
): Promise<{ success: boolean; jobs?: Job[]; error?: string }> {
  try {
    console.log('🔍 fetchOpenJobs: Iniciando busca de vagas abertas...');
    console.log('📊 Parâmetros:', { limit, offset });
    
    // Buscar vagas sem o join primeiro
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('📋 Resultado da query de jobs:', { jobsData, jobsError });

    if (jobsError) {
      console.error('❌ Erro na query de jobs:', jobsError);
      throw jobsError;
    }

    if (!jobsData || jobsData.length === 0) {
      console.log('ℹ️ Nenhuma vaga encontrada');
      return { success: true, jobs: [] };
    }

    // Se fornecido userId, filtrar vagas já aplicadas
    let filteredJobs = jobsData;
    if (excludeAppliedByUserId) {
      const { data: appliedJobs } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('applicant_id', excludeAppliedByUserId);
      
      const appliedJobIds = new Set(appliedJobs?.map(app => app.job_id) || []);
      filteredJobs = jobsData.filter(job => !appliedJobIds.has(job.id));
      
      console.log(`🔍 Filtradas ${jobsData.length - filteredJobs.length} vagas já aplicadas`);
    }

    if (filteredJobs.length === 0) {
      console.log('ℹ️ Nenhuma vaga nova encontrada (todas já foram aplicadas)');
      return { success: true, jobs: [] };
    }

    // Buscar dados dos recrutadores separadamente
    const recruiterIds = filteredJobs.map(job => job.recruiter_id);
    const { data: recruitersData, error: recruitersError } = await supabase
      .from('profiles')
      .select('id, name, company_name, avatar_url')
      .in('id', recruiterIds);

    console.log('📋 Resultado da query de recrutadores:', { recruitersData, recruitersError });

    if (recruitersError) {
      console.warn('⚠️ Erro ao buscar recrutadores:', recruitersError);
    }

    // Combinar os dados
    const jobsWithRecruiters = filteredJobs.map(job => ({
      ...job,
      recruiter: recruitersData?.find(r => r.id === job.recruiter_id) || undefined
    }));

    console.log('✅ Vagas encontradas:', jobsWithRecruiters.length);
    if (jobsWithRecruiters.length > 0) {
      console.log('📝 Primeira vaga:', jobsWithRecruiters[0]);
    }

    return { success: true, jobs: jobsWithRecruiters as Job[] };
  } catch (error: any) {
    console.error('❌ Erro ao buscar vagas abertas:', error);
    return { success: false, error: error.message || 'Erro ao buscar vagas' };
  }
}

/**
 * Candidata-se a uma vaga
 */
export async function applyToJob(
  jobId: string,
  applicantId: string
): Promise<{ success: boolean; application?: JobApplication; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        applicant_id: applicantId,
      })
      .select()
      .single();

    if (error) {
      // Se já existe candidatura, retornar sucesso
      if (error.code === '23505') {
        return { success: true };
      }
      throw error;
    }

    return { success: true, application: data as JobApplication };
  } catch (error: any) {
    console.error('Erro ao se candidatar:', error);
    return { success: false, error: error.message || 'Erro ao se candidatar à vaga' };
  }
}

/**
 * Verifica se um usuário é uma produtora (company)
 * @param userId - ID do usuário
 * @returns Promise<boolean> - true se for produtora, false caso contrário
 */
export async function isProducer(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('Erro ao verificar tipo de conta:', error);
      return false;
    }

    return data.account_type === 'company';
  } catch (error: any) {
    console.error('Erro ao verificar se é produtora:', error);
    return false;
  }
}

/**
 * Verifica se um usuário é um profissional
 * @param userId - ID do usuário
 * @returns Promise<boolean> - true se for profissional, false caso contrário
 */
export async function isProfessional(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('Erro ao verificar tipo de conta:', error);
      return false;
    }

    return data.account_type === 'professional';
  } catch (error: any) {
    console.error('Erro ao verificar se é profissional:', error);
    return false;
  }
}

/**
 * Verifica se um perfil é uma produtora (versão síncrona usando objeto profile)
 * @param profile - Objeto de perfil do usuário
 * @returns boolean - true se for produtora, false caso contrário
 */
export function isProducerProfile(profile: { account_type?: string | null } | null | undefined): boolean {
  return profile?.account_type === 'company';
}

/**
 * Verifica se um perfil é um profissional (versão síncrona usando objeto profile)
 * @param profile - Objeto de perfil do usuário
 * @returns boolean - true se for profissional, false caso contrário
 */
export function isProfessionalProfile(profile: { account_type?: string | null } | null | undefined): boolean {
  return profile?.account_type === 'professional';
}
