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

type AuthContextValue = {
  isReady: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    email: string;
    password: string;
    name: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const client = useMemo(() => createApiClient(), []);

  useEffect(() => {
    const stored = loadStoredAuth();
    setAccessToken(stored?.accessToken ?? null);
    setIsReady(true);
  }, []);

  const persist = useCallback((tokens: AuthTokens) => {
    saveStoredAuth(tokens);
    setAccessToken(tokens.accessToken);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const tokens = await client.request<AuthTokens>('/api/v1/auth/login', {
          method: 'POST',
          body: { email, password },
        });
        persist(tokens);
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
      persist(tokens);
    },
    [client, persist],
  );

  const logout = useCallback(() => {
    saveStoredAuth(null);
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({ isReady, accessToken, login, signup, logout }),
    [isReady, accessToken, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
