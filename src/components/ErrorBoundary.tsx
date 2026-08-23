import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logAppError } from '../lib/errorLogger';
import { ShieldAlert, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  isAdmin?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare state: State;
  declare props: Props;
  declare setState: Component<Props, State>['setState'];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    logAppError(error, {
      component: 'Global React ErrorBoundary',
      action: 'Component Render Failure',
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isAdmin = this.props.isAdmin;

      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-700/80 pb-5">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white">An Unexpected Issue Occurred</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  An automatic incident log has been generated for the academy administration.
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              We encountered a temporary technical glitch while loading this component. The issue has been automatically captured with complete diagnostic metadata for fixing.
            </p>

            {isAdmin && this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-rose-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Admin Debug View (Log ID Recorded)
                  </span>
                  <span className="text-2xs text-slate-500 font-mono">
                    {this.state.error.name}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-200 bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 overflow-x-auto">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="text-2xs font-mono text-slate-400">
                    <summary className="cursor-pointer text-slate-400 hover:text-slate-200 font-semibold mb-1">
                      View Stack Trace
                    </summary>
                    <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto max-h-48 text-slate-400 leading-relaxed">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.href = '/';
                }}
                className="py-3 px-5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-2xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
