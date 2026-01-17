import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Error Boundary simples
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Erro capturado pelo ErrorBoundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-screen bg-navy text-offWhite flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Erro ao carregar aplicação</h1>
            <p className="text-offWhite/60 mb-4">
              {this.state.error?.message || 'Ocorreu um erro inesperado'}
            </p>
            <details className="text-left text-xs text-offWhite/40 mb-4">
              <summary className="cursor-pointer mb-2">Stack trace</summary>
              <pre className="overflow-auto max-h-40 bg-graphite p-2 rounded">
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('App renderizado com sucesso');
} catch (error) {
  console.error('Erro ao renderizar app:', error);
  root.render(
    <div className="w-full min-h-screen bg-navy text-offWhite flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Erro crítico ao inicializar</h1>
        <p className="text-offWhite/60 mb-4">{String(error)}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gold text-navy font-bold rounded-lg hover:bg-goldHover transition-colors"
        >
          Recarregar Página
        </button>
      </div>
    </div>
  );
}