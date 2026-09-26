'use client';

import { Component, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/store/toastStore';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // Show toast notification
    toast.error('Something went wrong', error.message || 'An unexpected error occurred');
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-border p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h2>
            <p className="text-text-secondary mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-3 bg-secondary rounded-lg">
                <summary className="font-medium cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs text-text-tertiary overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
              <Link href="/">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-secondary transition">
                  <Home size={18} />
                  Go Home
                </button>
              </Link>
            </div>

            <p className="mt-4 text-xs text-text-tertiary">
              If this persists, please refresh the page or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;