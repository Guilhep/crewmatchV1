import React, { useState, lazy, Suspense, useEffect } from 'react';
import Landing from './views/Landing';
import Login from './views/Login';
import JobMatching from './views/JobMatching';
import Dashboard from './views/Dashboard';
import CompanyDashboard from './views/CompanyDashboard';
import Profile from './views/Profile';
import Messages from './views/Messages';
import CreateJob from './views/CreateJob';
import Feed from './views/Feed';
import MyJobs from './views/MyJobs';
import AuthGuard from './components/AuthGuard';
import { useAuth } from './hooks/useAuth';

// Lazy load do OnboardingWizard para evitar problemas de inicialização
const OnboardingWizard = lazy(() => import('./components/onboarding/OnboardingWizard'));

enum View {
  LANDING,
  LOGIN,
  DASHBOARD,
  MATCHING,
  ONBOARDING,
  PROFILE_EDIT,
  MESSAGES,
  CREATE_JOB,
  FEED,
  MY_JOBS
}

function App() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [justCompletedOnboarding, setJustCompletedOnboarding] = useState(false);
  const [messagesParams, setMessagesParams] = useState<{
    conversationId?: string;
    participantId?: string;
  } | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | undefined>(undefined);

  // Verificar se é empresa
  const isCompany = profile?.account_type === 'company';

  // Rotas protegidas que requerem autenticação
  const protectedViews = [
    View.DASHBOARD,
    View.MATCHING,
    View.PROFILE_EDIT,
    View.MESSAGES,
    View.CREATE_JOB,
    View.FEED,
    View.MY_JOBS,
  ];

  // Verificar autenticação e redirecionar conforme necessário
  useEffect(() => {
    if (loading) return;

    const isProtectedView = protectedViews.includes(currentView);
    const isLandingView = currentView === View.LANDING;

    // Se acabou de completar onboarding, não redirecionar
    if (justCompletedOnboarding) {
      setJustCompletedOnboarding(false);
      return;
    }

    // Se usuário não autenticado tenta acessar rota protegida -> redirecionar para landing
    if (isProtectedView && !user) {
      setCurrentView(View.LANDING);
      return;
    }

    // Se usuário autenticado tenta acessar landing -> redirecionar para dashboard
    if (isLandingView && user) {
      setCurrentView(View.DASHBOARD);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, currentView, justCompletedOnboarding]);

  // Simple view router with route protection
  const renderView = () => {
    try {
      switch (currentView) {
      case View.LANDING:
        return (
          <AuthGuard
            requireAuth={false}
            redirectTo={() => setCurrentView(View.DASHBOARD)}
          >
            <Landing
              onEnterApp={() => setCurrentView(View.LOGIN)}
              onRegister={() => setShowOnboarding(true)}
            />
          </AuthGuard>
        );
      case View.LOGIN:
        return (
          <AuthGuard
            requireAuth={false}
            redirectTo={() => setCurrentView(View.DASHBOARD)}
          >
            <Login
              onBack={() => setCurrentView(View.LANDING)}
              onLoginSuccess={() => setCurrentView(View.DASHBOARD)}
              onRegister={() => setShowOnboarding(true)}
            />
          </AuthGuard>
        );
      case View.DASHBOARD:
        return (
          <AuthGuard
            requireAuth={true}
            redirectTo={() => setCurrentView(View.LANDING)}
          >
            {isCompany ? (
              <CompanyDashboard
                onNavigateToProfile={() => setCurrentView(View.PROFILE_EDIT)}
                onNavigateToChat={(participantId) => {
                  setMessagesParams(participantId ? { participantId } : null);
                  setCurrentView(View.MESSAGES);
                }}
                onNavigateToFeed={() => setCurrentView(View.FEED)}
                onNavigateToJobs={() => setCurrentView(View.MY_JOBS)}
              />
            ) : (
              <Dashboard
                onNavigateToMatch={() => setCurrentView(View.MATCHING)}
                onNavigateToProfile={() => setCurrentView(View.PROFILE_EDIT)}
                onNavigateToChat={(participantId) => {
                  setMessagesParams(participantId ? { participantId } : null);
                  setCurrentView(View.MESSAGES);
                }}
                onNavigateToFeed={() => setCurrentView(View.FEED)}
                onNavigateToJobs={() => setCurrentView(View.MY_JOBS)}
              />
            )}
          </AuthGuard>
        );
      case View.MATCHING:
        return (
          <AuthGuard
            requireAuth={true}
            redirectTo={() => setCurrentView(View.LANDING)}
          >
            <JobMatching 
              onBack={() => setCurrentView(View.DASHBOARD)}
              onNavigateToHome={() => setCurrentView(View.DASHBOARD)}
              onNavigateToChat={(participantId) => {
                setMessagesParams(participantId ? { participantId } : null);
                setCurrentView(View.MESSAGES);
              }}
              onNavigateToProfile={() => setCurrentView(View.PROFILE_EDIT)}
            />
          </AuthGuard>
        );
      case View.PROFILE_EDIT:
        return (
          <AuthGuard
            requireAuth={true}
            redirectTo={() => setCurrentView(View.LANDING)}
          >
            <Profile
              onBack={() => {
                setProfileUserId(undefined);
                setCurrentView(View.DASHBOARD);
              }}
              onNavigateToHome={() => {
                setProfileUserId(undefined);
                setCurrentView(View.DASHBOARD);
              }}
              onNavigateToChat={(participantId) => {
                setMessagesParams(participantId ? { participantId } : null);
                setCurrentView(View.MESSAGES);
              }}
              onNavigateToProfile={() => {
                setProfileUserId(undefined);
                setCurrentView(View.DASHBOARD);
              }}
              userId={profileUserId}
            />
          </AuthGuard>
        );
      case View.MESSAGES:
        return (
          <AuthGuard
            requireAuth={true}
            redirectTo={() => setCurrentView(View.LANDING)}
          >
            <Messages
              onBack={() => {
                setMessagesParams(null);
                setCurrentView(View.DASHBOARD);
              }}
              onNavigateToHome={() => {
                setMessagesParams(null);
                setCurrentView(View.DASHBOARD);
              }}
              onNavigateToProfile={() => setCurrentView(View.PROFILE_EDIT)}
              onNavigateToMatch={() => setCurrentView(View.MATCHING)}
              initialConversationId={messagesParams?.conversationId}
              initialParticipantId={messagesParams?.participantId}
            />
          </AuthGuard>
        );
      case View.CREATE_JOB:
        return (
          <AuthGuard
            requireAuth={true}
            redirectTo={() => setCurrentView(View.LANDING)}
          >
            <CreateJob
              onBack={() => setCurrentView(View.DASHBOARD)}
              onSuccess={() => {
                // Job criado com sucesso, pode atualizar lista ou mostrar mensagem
              }}
            />
          </AuthGuard>
        );
      case View.FEED:
        return (
          <AuthGuard
            requireAuth={true}
            redirectTo={() => setCurrentView(View.LANDING)}
          >
            <Feed
              onNavigateToHome={() => setCurrentView(View.DASHBOARD)}
              onNavigateToChat={(participantId) => {
                setMessagesParams(participantId ? { participantId } : null);
                setCurrentView(View.MESSAGES);
              }}
              onNavigateToProfile={() => setCurrentView(View.PROFILE_EDIT)}
              onNavigateToMatch={() => setCurrentView(View.MATCHING)}
            />
          </AuthGuard>
        );
      case View.MY_JOBS:
        return (
          <AuthGuard
            requireAuth={true}
            redirectTo={() => setCurrentView(View.LANDING)}
          >
            <MyJobs
              onBack={() => setCurrentView(View.DASHBOARD)}
              onNavigateToHome={() => setCurrentView(View.DASHBOARD)}
              onNavigateToChat={(participantId) => {
                setMessagesParams(participantId ? { participantId } : null);
                setCurrentView(View.MESSAGES);
              }}
              onNavigateToProfile={(userId) => {
                setProfileUserId(userId);
                setCurrentView(View.PROFILE_EDIT);
              }}
              onNavigateToMatch={() => setCurrentView(View.MATCHING)}
            />
          </AuthGuard>
        );
      default:
        return (
          <AuthGuard
            requireAuth={false}
            redirectTo={() => setCurrentView(View.DASHBOARD)}
          >
            <Landing onEnterApp={() => setCurrentView(View.DASHBOARD)} />
          </AuthGuard>
        );
      }
    } catch (error: any) {
      console.error('Erro ao renderizar view:', error);
      return (
        <div className="flex items-center justify-center min-h-screen bg-navy p-4">
          <div className="text-center">
            <p className="text-red-400 mb-4">Erro ao carregar página</p>
            <p className="text-offWhite/60 text-sm mb-4">{error?.message || 'Erro desconhecido'}</p>
            <button
              onClick={() => setCurrentView(View.LANDING)}
              className="px-6 py-2 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      );
    }
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    setJustCompletedOnboarding(true);
    // Aguardar um pouco para o useAuth detectar o novo usuário
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentView(View.DASHBOARD);
  };

  // Se ainda está carregando inicialmente, mostrar loading
  if (loading && currentView === View.LANDING) {
    return (
      <main className="w-full min-h-screen bg-navy text-offWhite antialiased selection:bg-gold selection:text-navy flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-offWhite/80">Carregando...</p>
        </div>
      </main>
    );
  }

  // Renderizar view com tratamento de erro
  let viewContent;
  try {
    viewContent = renderView();
  } catch (error: any) {
    console.error('Erro ao renderizar view:', error);
    viewContent = (
      <div className="flex items-center justify-center min-h-screen bg-navy p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erro ao carregar página</p>
          <p className="text-offWhite/60 text-sm mb-4">{error?.message || 'Erro desconhecido'}</p>
          <button
            onClick={() => {
              setCurrentView(View.LANDING);
              window.location.reload();
            }}
            className="px-6 py-2 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen bg-navy text-offWhite antialiased selection:bg-gold selection:text-navy">
      {viewContent}
      {showOnboarding && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/95 backdrop-blur-md">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-offWhite/80">Carregando...</p>
            </div>
          </div>
        }>
          <OnboardingWizard
            onComplete={handleOnboardingComplete}
            onClose={() => setShowOnboarding(false)}
          />
        </Suspense>
      )}
    </main>
  );
}

export default App;