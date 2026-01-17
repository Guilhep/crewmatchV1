import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AccountDetailsStep from './AccountDetailsStep';
import AccountDetailsStepCompany from './AccountDetailsStepCompany';
import QuizStep from './QuizStep';
import ResultStep from './ResultStep';
import { ONBOARDING_QUESTIONS, calculateLevel } from '../../constants/onboardingQuestions';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface OnboardingWizardProps {
  onComplete: () => void;
  onClose?: () => void;
}

type UserType = 'professional' | 'company';
type Step = 'select-type' | 'account' | 'quiz' | 'result';

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState<Step>('select-type');
  const [userType, setUserType] = useState<UserType>('professional');
  const [accountData, setAccountData] = useState<{
    name: string;
    email: string;
    password: string;
    companyName?: string;
    cnpj?: string;
  } | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; level: ReturnType<typeof calculateLevel> } | null>(null);

  const handleTypeSelect = (type: UserType) => {
    setUserType(type);
    setCurrentStep('account');
  };

  const handleAccountSubmit = (data: { name: string; email: string; password: string }) => {
    setAccountData(data);
    // Apenas profissionais vão para o quiz
    setCurrentStep('quiz');
  };

  const handleCompanyAccountSubmit = (data: {
    name: string;
    companyName: string;
    email: string;
    password: string;
    cnpj: string;
  }) => {
    setAccountData({
      name: data.name,
      email: data.email,
      password: data.password,
      companyName: data.companyName,
      cnpj: data.cnpj,
    });
    handleCompanySignup(data);
  };

  const handleCompanySignup = async (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    cnpj: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        setError('Supabase não está configurado. Não foi possível criar a conta.');
        setIsLoading(false);
        return;
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            full_name: data.name,
            role: 'company',
          },
        },
      });

      if (authError) {
        setError(`Erro ao criar conta: ${authError.message}`);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }

      // Aguardar um pouco para o trigger processar
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Atualizar perfil com dados da empresa
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          account_type: 'company',
          company_name: data.companyName,
          cnpj: data.cnpj.replace(/\D/g, ''),
          onboarding_completed: true,
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Erro ao atualizar perfil da empresa:', updateError);
        // Tentar criar perfil manualmente se não existir
        const { error: insertError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          full_name: data.name,
          account_type: 'company',
          company_name: data.companyName,
          cnpj: data.cnpj.replace(/\D/g, ''),
          role: 'company',
          onboarding_completed: true,
        });

        if (insertError) {
          setError(`Conta criada, mas houve um problema ao salvar os dados da empresa: ${insertError.message}`);
          setIsLoading(false);
          return;
        }
      }

      // Sucesso - redirecionar para home
      setIsLoading(false);
      onComplete();
    } catch (err: any) {
      console.error('Erro ao criar conta da empresa:', err);
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleQuizNext = () => {
    if (currentQuestionIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Finalizar quiz e calcular resultado
      handleQuizComplete();
    }
  };

  const handleQuizPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const calculateScore = (): number => {
    let correct = 0;
    ONBOARDING_QUESTIONS.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const handleQuizComplete = async () => {
    if (!accountData) return;

    setIsLoading(true);
    setError(null);

    try {
      // Calcular score primeiro (sempre funciona)
      const score = calculateScore();
      const level = calculateLevel(score);
      setResult({ score, level });

      // Verificar se o Supabase está configurado antes de tentar criar usuário
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase não está configurado. Mostrando resultado do quiz sem salvar no banco.');
        // Mostrar resultado mesmo sem Supabase
        setCurrentStep('result');
        setIsLoading(false);
        return;
      }

      // Tentar criar usuário no Supabase Auth
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: accountData.email,
          password: accountData.password,
          options: {
            data: {
              name: accountData.name,
              full_name: accountData.name,
              role: 'professional',
            },
          },
        });

        if (authError) {
          // Se houver erro de autenticação, mostrar resultado mesmo assim
          console.warn('Erro ao criar usuário no Supabase:', authError);
          setError(`Aviso: Não foi possível salvar sua conta (${authError.message}). Mas você pode ver seu resultado do quiz.`);
          setCurrentStep('result');
          setIsLoading(false);
          return;
        }

        if (!authData.user) {
          throw new Error('Falha ao criar usuário');
        }

        // Aguardar um pouco para o trigger processar
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Atualizar perfil com account_type e dados do quiz
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            account_type: 'professional',
            level_id: level,
            quiz_score: score,
            onboarding_completed: true,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.warn('Erro ao atualizar perfil:', updateError);
          // Tentar criar perfil diretamente como fallback
          const { error: insertError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            email: accountData.email,
            name: accountData.name,
            full_name: accountData.name,
            role: 'professional',
            account_type: 'professional',
            level_id: level,
            quiz_score: score,
            onboarding_completed: true,
          });

          if (insertError) {
            console.warn('Erro ao criar perfil diretamente:', insertError);
            setError(`Aviso: Conta criada, mas perfil não foi salvo (${insertError.message}). Você ainda pode ver seu resultado.`);
          }
        }

        setCurrentStep('result');
      } catch (supabaseError: any) {
        // Erro ao conectar com Supabase - mostrar resultado mesmo assim
        console.error('Erro ao conectar com Supabase:', supabaseError);
        const errorMessage = supabaseError.message || supabaseError.toString() || 'Failed to fetch';
        setError(`Aviso: Não foi possível conectar com o servidor para salvar sua conta. Mas você pode ver seu resultado do quiz abaixo.`);
        // Garantir que o resultado seja mostrado
        setCurrentStep('result');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Erro no onboarding:', err);
      // Mesmo com erro, mostrar resultado se já foi calculado
      if (result) {
        setError(`Aviso: ${err.message || 'Erro ao salvar conta'}. Mas você pode ver seu resultado.`);
        setCurrentStep('result');
      } else {
        setError(err.message || 'Erro ao processar quiz. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultComplete = () => {
    onComplete();
  };

  const allQuestionsAnswered = ONBOARDING_QUESTIONS.every((q) => answers[q.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy/95 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-navy border border-white/10 rounded-2xl shadow-2xl p-8 md:p-12"
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-offWhite/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        )}

        {/* Error Message - apenas mostrar se não estiver no step de resultado */}
        {error && currentStep !== 'result' && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
            {error}
          </div>
        )}

        {/* Warning Message no resultado */}
        {error && currentStep === 'result' && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
            <p className="font-semibold mb-1">⚠️ Aviso</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy/80 backdrop-blur-sm rounded-2xl z-10">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-offWhite/80">Criando sua conta...</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 'select-type' && (
            <motion.div
              key="select-type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="mb-8 text-center">
                <h2 className="mb-3 font-serif text-3xl font-bold text-white">Bem-vindo ao CrewMatch</h2>
                <p className="text-offWhite/60 font-sans">Escolha o tipo de conta</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleTypeSelect('professional')}
                  className="w-full p-6 bg-graphite border-2 border-white/10 rounded-xl hover:border-gold hover:bg-graphite/80 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Sou Profissional</h3>
                      <p className="text-sm text-offWhite/60">Freelancer ou profissional autônomo</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleTypeSelect('company')}
                  className="w-full p-6 bg-graphite border-2 border-white/10 rounded-xl hover:border-gold hover:bg-graphite/80 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <span className="text-2xl">🏢</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Sou Produtora</h3>
                      <p className="text-sm text-offWhite/60">Empresa ou produtora de conteúdo</p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'account' && userType === 'professional' && (
            <AccountDetailsStep key="account-professional" onNext={handleAccountSubmit} />
          )}

          {currentStep === 'account' && userType === 'company' && (
            <AccountDetailsStepCompany key="account-company" onNext={handleCompanyAccountSubmit} />
          )}

          {currentStep === 'quiz' && (
            <QuizStep
              key="quiz"
              questions={ONBOARDING_QUESTIONS}
              currentQuestionIndex={currentQuestionIndex}
              answers={answers}
              onAnswerSelect={handleAnswerSelect}
              onNext={handleQuizNext}
              onPrevious={handleQuizPrevious}
            />
          )}

          {currentStep === 'result' && result && (
            <ResultStep
              key="result"
              score={result.score}
              level={result.level}
              totalQuestions={ONBOARDING_QUESTIONS.length}
              onComplete={handleResultComplete}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default OnboardingWizard;
