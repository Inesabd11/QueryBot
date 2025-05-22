import React, { Component, ErrorInfo, ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChatBot Error:', {
      error: error.message,
      stack: errorInfo.componentStack
    });
  }

  private handleDismiss = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
              ChatBot Error
            </h2>
            <button 
              onClick={this.handleDismiss}
              className="text-red-500 hover:text-red-700"
            >
              <X size={20} />
            </button>
          </div>
          <p className="mt-2 text-red-600 dark:text-red-300">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleDismiss}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}