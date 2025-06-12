// filename: frontend/src/components/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { Helper, SecureDataResponse } from '../types/api';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [secureData, setSecureData] = useState<SecureDataResponse | null>(null);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load secure data
      const secureDataResponse = await apiService.getSecureData();
      setSecureData(secureDataResponse);

      // Load helpers
      const helpersResponse = await apiService.getHelpers();
      setHelpers(helpersResponse);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Parkrun Helper Organizer</h1>
          <div style={styles.userInfo}>
            <span style={styles.userName}>Welcome, {user?.name}</span>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
            <button onClick={loadData} style={styles.retryButton}>
              Retry
            </button>
          </div>
        )}

        {secureData && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Dashboard Overview</h2>
            <div style={styles.stats}>
              <div style={styles.stat}>
                <div style={styles.statNumber}>{secureData.data.totalVolunteers}</div>
                <div style={styles.statLabel}>Total Volunteers</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statNumber}>{secureData.data.upcomingEvents}</div>
                <div style={styles.statLabel}>Upcoming Events</div>
              </div>
            </div>
            <p style={styles.lastUpdated}>
              Last updated: {new Date(secureData.data.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Registered Helpers ({helpers.length})</h2>
          {helpers.length === 0 ? (
            <p style={styles.noData}>No helpers registered yet.</p>
          ) : (
            <div style={styles.helpersList}>
              {helpers.map((helper) => (
                <div key={helper.id} style={styles.helperItem}>
                  <div style={styles.helperInfo}>
                    <div style={styles.helperName}>{helper.name}</div>
                    <div style={styles.helperDetails}>
                      Parkrun ID: {helper.parkrunId}
                      {helper.email && ` • ${helper.email}`}
                    </div>
                  </div>
                  <div style={styles.helperDate}>
                    Added: {new Date(helper.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>API Connection Test</h2>
          <p style={styles.apiMessage}>{secureData?.message}</p>
          <p style={styles.timestamp}>
            Response received at: {secureData?.timestamp ? new Date(secureData.timestamp).toLocaleString() : 'N/A'}
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
  },
  header: {
    background: 'white',
    borderBottom: '2px solid #FF6900',
    padding: '20px',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#003D71',
    fontSize: '1.8rem',
    fontWeight: '900',
    margin: '0',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  userName: {
    color: '#003D71',
    fontWeight: '600',
  },
  logoutButton: {
    padding: '8px 16px',
    background: '#FF6900',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 20px',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '50px',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    background: '#fff5f0',
    border: '2px solid #FF6900',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    color: '#cc0000',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryButton: {
    padding: '5px 10px',
    background: '#003D71',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    marginBottom: '20px',
    border: '2px solid #003D71',
  },
  cardTitle: {
    color: '#003D71',
    fontSize: '1.3rem',
    fontWeight: '900',
    marginBottom: '15px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  stats: {
    display: 'flex',
    gap: '30px',
    marginBottom: '15px',
  },
  stat: {
    textAlign: 'center' as const,
    background: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    border: '2px solid #FF6900',
    minWidth: '120px',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: '900',
    color: '#003D71',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  lastUpdated: {
    color: '#666',
    fontSize: '14px',
    margin: '0',
  },
  noData: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center' as const,
    padding: '20px',
  },
  helpersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  helperItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    background: '#f5f5f5',
    borderRadius: '8px',
    border: '1px solid #ddd',
  },
  helperInfo: {
    flex: 1,
  },
  helperName: {
    fontWeight: '700',
    color: '#003D71',
    marginBottom: '5px',
  },
  helperDetails: {
    color: '#666',
    fontSize: '14px',
  },
  helperDate: {
    color: '#666',
    fontSize: '12px',
  },
  apiMessage: {
    color: '#003D71',
    fontWeight: '600',
    marginBottom: '10px',
  },
  timestamp: {
    color: '#666',
    fontSize: '14px',
    margin: '0',
  },
};

export default Dashboard;