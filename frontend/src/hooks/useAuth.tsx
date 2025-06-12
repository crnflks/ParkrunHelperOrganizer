// filename: frontend/src/hooks/useAuth.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  PublicClientApplication, 
  AccountInfo, 
  AuthenticationResult,
  SilentRequest 
} from '@azure/msal-browser';
import { msalConfig, loginRequest, apiRequest } from '../config/msalConfig';
import { apiService } from '../services/api';
import { AuthContextType, User } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await msalInstance.initialize();
      
      // Check if user is already signed in
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
        await handleAuthSuccess(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async (account: AccountInfo) => {
    try {
      // Get access token for API calls
      const tokenResponse = await getAccessToken();
      if (tokenResponse) {
        // Store token for API service
        apiService.setAccessToken(tokenResponse);
        
        // Set user info
        const userInfo: User = {
          userId: account.localAccountId,
          email: account.username,
          name: account.name || account.username,
          roles: [], // Would come from token claims
          scopes: [], // Would come from token claims
        };
        
        setUser(userInfo);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to handle auth success:', error);
    }
  };

  const login = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response: AuthenticationResult = await msalInstance.loginPopup(loginRequest);
      
      if (response.account) {
        msalInstance.setActiveAccount(response.account);
        await handleAuthSuccess(response.account);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      apiService.setAccessToken('');
      
      // Logout from MSAL
      await msalInstance.logoutPopup({
        postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const account = msalInstance.getActiveAccount();
      if (!account) {
        throw new Error('No active account found');
      }

      const silentRequest: SilentRequest = {
        ...apiRequest,
        account,
      };

      const response = await msalInstance.acquireTokenSilent(silentRequest);
      return response.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      
      // If silent request fails, try popup
      try {
        const response = await msalInstance.acquireTokenPopup(apiRequest);
        return response.accessToken;
      } catch (popupError) {
        console.error('Failed to get access token via popup:', popupError);
        return null;
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};