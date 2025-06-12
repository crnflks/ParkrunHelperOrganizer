// filename: frontend/src/config/msalConfig.ts

import { Configuration, LogLevel } from '@azure/msal-browser';

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || '',
    authority: process.env.REACT_APP_AZURE_AUTHORITY || '',
    redirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: process.env.REACT_APP_POST_LOGOUT_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
  },
};

// Add scopes for your API here
export const loginRequest = {
  scopes: [
    'openid',
    'profile',
    'email',
    process.env.REACT_APP_API_SCOPE || 'api://your-api-client-id/api.access'
  ],
};

// Scopes for API calls
export const apiRequest = {
  scopes: [
    process.env.REACT_APP_API_SCOPE || 'api://your-api-client-id/api.access'
  ],
};

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';