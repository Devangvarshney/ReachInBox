import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { User } from '../types';
import { DEFAULT_USER } from '../services/mockData';
import { getGoogleAuthConfigApi, loginGoogleApi } from '../services/api';

interface GoogleJwtPayload {
  sub: string;
  name: string;
  email: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  googleClientId: string;
  setGoogleClientId: (id: string) => void;
  loginWithGoogleCredential: (credential: string) => Promise<void>;
  loginWithGoogleProfile: (profile: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    accessToken?: string;
    idToken?: string;
    code?: string;
  }) => Promise<void>;
  loginWithDemo: (customUser?: Partial<User>) => void;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
}

const STORAGE_KEY = 'reachinbox_auth_user';
const CLIENT_ID_KEY = 'reachinbox_google_client_id';

// Default Google OAuth Client ID
const DEFAULT_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1042804486141-bl26uakn62htpnhtvqdge9lpcto6dhbf.apps.googleusercontent.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      return null;
    } catch {
      return null;
    }
  });

  const [googleClientId, setGoogleClientIdState] = useState<string>(() => {
    return localStorage.getItem(CLIENT_ID_KEY) || DEFAULT_CLIENT_ID;
  });

  // Sync client ID from backend API if configured there
  useEffect(() => {
    getGoogleAuthConfigApi().then(config => {
      if (config?.clientId) {
        setGoogleClientIdState(config.clientId);
        localStorage.setItem(CLIENT_ID_KEY, config.clientId);
      }
    });
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const setGoogleClientId = (id: string) => {
    setGoogleClientIdState(id);
    localStorage.setItem(CLIENT_ID_KEY, id);
  };

  const loginWithGoogleProfile = async (profile: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    accessToken?: string;
    idToken?: string;
    code?: string;
  }) => {
    const newUser: User = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar || DEFAULT_USER.avatar,
      token: profile.idToken || profile.accessToken,
      accessToken: profile.accessToken,
      isCustomGoogleUser: true,
    };
    setUser(newUser);

    // Sync with backend SQLite database and register sender account
    try {
      await loginGoogleApi({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        googleId: profile.id,
        accessToken: profile.accessToken,
        code: profile.code,
      });
    } catch (err: any) {
      console.warn('[AuthContext] Could not sync user with backend:', err.message);
    }
  };

  const loginWithGoogleCredential = async (credential: string) => {
    try {
      const decoded = jwtDecode<GoogleJwtPayload>(credential);
      const newUser: User = {
        id: decoded.sub,
        name: decoded.name || 'Google User',
        email: decoded.email,
        avatar: decoded.picture || DEFAULT_USER.avatar,
        token: credential,
        isCustomGoogleUser: true,
      };
      setUser(newUser);

      // Sync with backend
      await loginGoogleApi({
        email: decoded.email,
        name: decoded.name,
        avatar: decoded.picture,
        googleId: decoded.sub,
      });
    } catch (err) {
      console.error('Failed to decode Google JWT credential', err);
      loginWithDemo({ name: 'Google Verified User' });
    }
  };

  const loginWithDemo = (customUser?: Partial<User>) => {
    const newUser: User = {
      ...DEFAULT_USER,
      ...customUser,
      id: customUser?.id || `user_${Date.now()}`,
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        googleClientId,
        setGoogleClientId,
        loginWithGoogleCredential,
        loginWithGoogleProfile,
        loginWithDemo,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
