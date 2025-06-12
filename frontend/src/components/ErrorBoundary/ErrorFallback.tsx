// Specialized error fallback components for different contexts
import React from 'react';

export interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
}

// Minimal error fallback for inline errors
export const MinimalErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  title = 'Error',
  message = 'Something went wrong',
}) => (
  <div style={styles.minimal}>
    <span style={styles.minimalIcon}>❌</span>
    <span style={styles.minimalText}>{message}</span>
    {onRetry && (
      <button onClick={onRetry} style={styles.minimalButton}>
        Retry
      </button>
    )}
  </div>
);

// Card-style error fallback
export const CardErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  title = 'Unable to load content',
  message = 'An error occurred while loading this section.',
  showDetails = false,
}) => (
  <div style={styles.card}>
    <div style={styles.cardIcon}>⚠️</div>
    <h3 style={styles.cardTitle}>{title}</h3>
    <p style={styles.cardMessage}>{message}</p>
    
    {showDetails && error && (
      <details style={styles.cardDetails}>
        <summary>Technical Details</summary>
        <pre style={styles.cardError}>{error.message}</pre>
      </details>
    )}
    
    {onRetry && (
      <button onClick={onRetry} style={styles.cardButton}>
        Try Again
      </button>
    )}
  </div>
);

// Page-level error fallback
export const PageErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  title = 'Page Error',
  message = 'This page encountered an error and cannot be displayed.',
  showDetails = process.env.NODE_ENV === 'development',
}) => (
  <div style={styles.page}>
    <div style={styles.pageContent}>
      <div style={styles.pageIcon}>🚨</div>
      <h1 style={styles.pageTitle}>{title}</h1>
      <p style={styles.pageMessage}>{message}</p>
      
      <div style={styles.pageActions}>
        <button 
          onClick={() => window.location.href = '/'}
          style={styles.pageHomeButton}
        >
          Go Home
        </button>
        {onRetry && (
          <button onClick={onRetry} style={styles.pageRetryButton}>
            Try Again
          </button>
        )}
        <button 
          onClick={() => window.location.reload()}
          style={styles.pageReloadButton}
        >
          Reload Page
        </button>
      </div>

      {showDetails && error && (
        <details style={styles.pageDetails}>
          <summary>Error Details</summary>
          <div style={styles.pageErrorContent}>
            <p><strong>Message:</strong> {error.message}</p>
            <pre style={styles.pageStack}>{error.stack}</pre>
          </div>
        </details>
      )}
    </div>
  </div>
);

// Network error fallback
export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({
  onRetry,
  title = 'Network Error',
  message = 'Unable to connect to the server. Please check your connection.',
}) => (
  <div style={styles.network}>
    <div style={styles.networkIcon}>📡</div>
    <h3 style={styles.networkTitle}>{title}</h3>
    <p style={styles.networkMessage}>{message}</p>
    {onRetry && (
      <button onClick={onRetry} style={styles.networkButton}>
        Retry Connection
      </button>
    )}
  </div>
);

// Loading error fallback
export const LoadingErrorFallback: React.FC<ErrorFallbackProps> = ({
  onRetry,
  title = 'Loading Failed',
  message = 'Content could not be loaded.',
}) => (
  <div style={styles.loading}>
    <div style={styles.loadingIcon}>⏳</div>
    <p style={styles.loadingTitle}>{title}</p>
    <p style={styles.loadingMessage}>{message}</p>
    {onRetry && (
      <button onClick={onRetry} style={styles.loadingButton}>
        Reload
      </button>
    )}
  </div>
);

const styles = {
  // Minimal styles
  minimal: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '4px',
    fontSize: '14px',
  },
  minimalIcon: {
    fontSize: '16px',
  },
  minimalText: {
    color: '#856404',
    flex: 1,
  },
  minimalButton: {
    padding: '4px 8px',
    backgroundColor: '#ffc107',
    color: '#856404',
    border: 'none',
    borderRadius: '3px',
    fontSize: '12px',
    cursor: 'pointer',
  },

  // Card styles
  card: {
    padding: '24px',
    backgroundColor: 'white',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    textAlign: 'center' as const,
    maxWidth: '400px',
    margin: '0 auto',
  },
  cardIcon: {
    fontSize: '32px',
    marginBottom: '16px',
  },
  cardTitle: {
    color: '#dc3545',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    margin: '0 0 8px 0',
  },
  cardMessage: {
    color: '#6c757d',
    fontSize: '14px',
    lineHeight: '1.4',
    marginBottom: '16px',
  },
  cardDetails: {
    textAlign: 'left' as const,
    marginBottom: '16px',
    fontSize: '12px',
  },
  cardError: {
    backgroundColor: '#f8f9fa',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '11px',
    overflow: 'auto',
    maxHeight: '100px',
  },
  cardButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },

  // Page styles
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#f8f9fa',
  },
  pageContent: {
    textAlign: 'center' as const,
    maxWidth: '500px',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  pageIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  pageTitle: {
    color: '#dc3545',
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },
  pageMessage: {
    color: '#6c757d',
    fontSize: '16px',
    lineHeight: '1.5',
    marginBottom: '32px',
  },
  pageActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginBottom: '24px',
  },
  pageHomeButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  pageRetryButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  pageReloadButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  pageDetails: {
    textAlign: 'left' as const,
    fontSize: '12px',
    color: '#6c757d',
  },
  pageErrorContent: {
    marginTop: '8px',
  },
  pageStack: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '11px',
    overflow: 'auto',
    maxHeight: '200px',
    fontFamily: 'monospace',
  },

  // Network styles
  network: {
    textAlign: 'center' as const,
    padding: '32px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    maxWidth: '300px',
    margin: '0 auto',
  },
  networkIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  networkTitle: {
    color: '#856404',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    margin: '0 0 8px 0',
  },
  networkMessage: {
    color: '#856404',
    fontSize: '14px',
    marginBottom: '16px',
  },
  networkButton: {
    padding: '10px 20px',
    backgroundColor: '#ffc107',
    color: '#856404',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },

  // Loading styles
  loading: {
    textAlign: 'center' as const,
    padding: '24px',
  },
  loadingIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  loadingTitle: {
    color: '#6c757d',
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  loadingMessage: {
    color: '#6c757d',
    fontSize: '14px',
    marginBottom: '16px',
  },
  loadingButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};