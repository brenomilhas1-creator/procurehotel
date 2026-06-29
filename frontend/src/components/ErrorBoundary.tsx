'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { log } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  scope?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary global que renderiza fallback com botão de reload.
 * Não captura erros em event handlers (usar try-catch para esses).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error('boundary', error.message, {
      component_stack: info.componentStack?.slice(0, 500),
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-6 m-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-1 shrink-0" />
            <div className="flex-1">
              <h2 className="font-semibold text-red-900">Algo correu mal</h2>
              <p className="text-sm text-red-700 mt-1">
                {this.state.error?.message || 'Erro inesperado.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" /> Recarregar página
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
