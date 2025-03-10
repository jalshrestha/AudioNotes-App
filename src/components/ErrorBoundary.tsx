'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-4 border border-red-500 bg-red-50 text-red-700 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="mb-2">Please try refreshing the page.</p>
          <details className="text-sm">
            <summary>Error details</summary>
            <p className="mt-1 p-2 bg-red-100 rounded">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 