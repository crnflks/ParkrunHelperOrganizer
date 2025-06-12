// filename: frontend/src/types/auth.ts

export interface User {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  scopes: string[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}