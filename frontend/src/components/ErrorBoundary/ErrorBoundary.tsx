// React Error Boundary component for graceful error handling
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console and external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external error reporting service (e.g., Sentry)
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index])) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }, 100);
  };

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // In a real application, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    // Example: Send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // }).catch(console.error);
    }

    console.error('Error Report:', errorReport);
  }

  private getCurrentUserId(): string | null {
    // Get user ID from Redux store or local storage
    try {
      const authData = sessionStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id || null;
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  }

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>
              We're sorry, but something unexpected happened. The error has been logged and our team will investigate.
            </p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Development Only)</summary>
                <div style={styles.errorContent}>
                  <p><strong>Error:</strong> {error.message}</p>
                  <pre style={styles.stack}>{error.stack}</pre>
                  {errorInfo && (
                    <>
                      <p><strong>Component Stack:</strong></p>
                      <pre style={styles.componentStack}>{errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div style={styles.actions}>
              <button 
                onClick={this.resetErrorBoundary} 
                style={styles.retryButton}
                aria-label="Try again"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()} 
                style={styles.reloadButton}
                aria-label="Reload page"
              >
                Reload Page
              </button>
            </div>

            {errorId && (
              <p style={styles.errorId}>
                Error ID: {errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
  },
  content: {
    textAlign: 'center' as const,
    maxWidth: '600px',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e9ecef',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  title: {
    color: '#dc3545',
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },
  message: {
    color: '#6c757d',
    fontSize: '16px',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  details: {
    textAlign: 'left' as const,
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #dee2e6',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '12px',
  },
  errorContent: {
    fontSize: '14px',
    color: '#495057',
  },
  stack: {
    backgroundColor: '#e9ecef',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px',
    fontFamily: 'monospace',
  },
  componentStack: {
    backgroundColor: '#e9ecef',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '150px',
    fontFamily: 'monospace',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  retryButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  reloadButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  errorId: {
    fontSize: '12px',
    color: '#6c757d',
    fontFamily: 'monospace',
    margin: '0',
  },
};