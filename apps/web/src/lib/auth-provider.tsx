'use client';

import {
  ApiRequestError,
  loadStoredAuth,
  saveStoredAuth,
  type AuthTokens,
} from '@catch-coffee/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createApiClient } from './api';
import type { UserProfile } from './user-profile';

type AuthContextValue = {
  isReady: boolean;
  accessToken: string | null;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    email: string;
    password: string;
    name: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const client = useMemo(() => createApiClient(), []);

  const refreshUser = useCallback(async () => {
    const token = loadStoredAuth()?.accessToken;
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const profile = await client.request<UserProfile>('/api/v1/me');
      setUser(profile);
    } catch {
      saveStoredAuth(null);
      setAccessToken(null);
      setUser(null);
    }
  }, [client]);

  useEffect(() => {
    const stored = loadStoredAuth();
    setAccessToken(stored?.accessToken ?? null);
    setIsReady(true);
    if (stored?.accessToken) {
      void refreshUser();
    }
  }, [refreshUser]);

  const persist = useCallback(
    async (tokens: AuthTokens) => {
      saveStoredAuth(tokens);
      setAccessToken(tokens.accessToken);
      await refreshUser();
    },
    [refreshUser],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const tokens = await client.request<AuthTokens>('/api/v1/auth/login', {
          method: 'POST',
          body: { email, password },
        });
        await persist(tokens);
      } catch (error) {
        if (error instanceof ApiRequestError) throw error;
        throw new Error('로그인에 실패했습니다.');
      }
    },
    [client, persist],
  );

  const signup = useCallback(
    async (input: { email: string; password: string; name: string }) => {
      const tokens = await client.request<AuthTokens>('/api/v1/auth/signup', {
        method: 'POST',
        body: input,
      });
      await persist(tokens);
    },
    [client, persist],
  );

  const logout = useCallback(() => {
    saveStoredAuth(null);
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ isReady, accessToken, user, login, signup, logout, refreshUser }),
    [isReady, accessToken, user, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
