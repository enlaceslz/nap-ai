import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#101726] border border-white/10 rounded-2xl p-8 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                {this.props.fallbackTitle || 'Ops! Ocorreu uma instabilidade visual'}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {this.props.fallbackMessage || 'A página encontrou uma exceção ao renderizar. Você pode recarregar ou voltar para a tela inicial.'}
              </p>
              {this.state.error && (
                <div className="p-3 bg-slate-950 border border-white/5 rounded-xl text-left text-xs font-mono text-rose-400 overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <RefreshCw size={15} />
                <span>Recarregar</span>
              </button>
              <a
                href="/"
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 border border-white/10"
              >
                <Home size={15} />
                <span>Início</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
