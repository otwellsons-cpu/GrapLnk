import { Component, ErrorInfo, ReactNode } from 'react';
import { Trophy } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-2xl mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">
              OOPS!
            </h1>
            <p className="text-gray-600 mb-4">
              Something went wrong. Please refresh the page.
            </p>
            {this.state.error && (
              <p className="text-sm text-gray-500 font-mono bg-gray-100 p-3 rounded">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
