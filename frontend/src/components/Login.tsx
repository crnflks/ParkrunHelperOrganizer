// filename: frontend/src/components/Login.tsx

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await login();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <img 
            src="https://cdn.brandfetch.io/idtc7X5XcQ/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B" 
            alt="Parkrun Logo" 
            style={styles.logo}
          />
          <h1 style={styles.title}>Parkrun Helper Organizer</h1>
          <p style={styles.subtitle}>Sign in to manage volunteer schedules</p>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            ...styles.button,
            ...(isLoading ? styles.buttonDisabled : {}),
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
        </button>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            You'll be redirected to Microsoft to sign in with your account.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    border: '2px solid #FF6900',
    textAlign: 'center' as const,
  },
  header: {
    marginBottom: '30px',
  },
  logo: {
    width: '80px',
    height: '80px',
    marginBottom: '20px',
    borderRadius: '8px',
  },
  title: {
    color: '#003D71',
    fontSize: '1.8rem',
    fontWeight: '900',
    marginBottom: '10px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: '#666',
    fontSize: '1rem',
    margin: '0',
  },
  error: {
    background: '#fff5f0',
    border: '2px solid #FF6900',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    color: '#cc0000',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '16px',
    background: '#003D71',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  buttonDisabled: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  },
  footerText: {
    color: '#666',
    fontSize: '14px',
    margin: '0',
  },
};

export default Login;