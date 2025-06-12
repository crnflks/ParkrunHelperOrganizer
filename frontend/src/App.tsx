// filename: frontend/src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useServiceWorker } from './hooks/useServiceWorker';
import { defaultServiceWorkerConfig } from './utils/serviceWorker';
import { ErrorBoundary, PageErrorFallback } from './components/ErrorBoundary';
import { SkipLink } from './components/Accessibility';
import { DashboardSkeleton } from './components/LoadingSkeleton';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={styles.loading} role="status" aria-label="Loading application">
        <DashboardSkeleton />
        <div style={styles.loadingContent}>
          <div style={styles.spinner} aria-hidden="true"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={styles.loading} role="status" aria-label="Loading application">
        <div style={styles.loadingContent}>
          <div style={styles.spinner} aria-hidden="true"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const AppRoutes: React.FC = () => {
  // Initialize service worker
  const { isOnline, updateAvailable } = useServiceWorker(defaultServiceWorkerConfig);

  return (
    <Router>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      
      {/* Offline indicator */}
      {!isOnline && (
        <div style={styles.offlineIndicator} role="banner" aria-live="polite">
          📡 You're offline. Some features may be limited.
        </div>
      )}
      
      {/* Update notification */}
      {updateAvailable && (
        <div style={styles.updateIndicator} role="banner" aria-live="polite">
          🔄 A new version is available. Refresh to update.
        </div>
      )}

      <main id="main-content">
        <ErrorBoundary
          fallback={<PageErrorFallback />}
          onError={(error, errorInfo) => {
            console.error('App Error:', error, errorInfo);
          }}
        >
          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />
            <Route 
              path="*" 
              element={<Navigate to="/dashboard" replace />} 
            />
          </Routes>
        </ErrorBoundary>
      </main>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ErrorBoundary
        fallback={<PageErrorFallback title="Application Error" />}
        onError={(error, errorInfo) => {
          console.error('Root App Error:', error, errorInfo);
        }}
      >
        <AuthProvider>
          <div style={styles.app}>
            <AppRoutes />
          </div>
        </AuthProvider>
      </ErrorBoundary>
    </Provider>
  );
};

const styles = {
  app: {
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    padding: '20px',
  },
  loadingContent: {
    textAlign: 'center' as const,
    color: '#003D71',
    marginTop: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #003D71',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  offlineIndicator: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '12px 20px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #ffeaa7',
    fontSize: '14px',
    fontWeight: '600',
  },
  updateIndicator: {
    backgroundColor: '#d1ecf1',
    color: '#0c5460',
    padding: '12px 20px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #bee5eb',
    fontSize: '14px',
    fontWeight: '600',
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default App;