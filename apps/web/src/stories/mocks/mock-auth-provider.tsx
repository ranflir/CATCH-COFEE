'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { UserProfile } from '@/lib/user-profile';

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

export function AuthProvider({
  children,
  user = null,
  isReady = true,
  accessToken,
}: {
  children: ReactNode;
  user?: UserProfile | null;
  isReady?: boolean;
  accessToken?: string | null;
}) {
  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      accessToken: accessToken ?? (user ? 'mock-token' : null),
      user,
      login: async () => {},
      signup: async () => {},
      logout: () => {},
      refreshUser: async () => {},
    }),
    [user, isReady, accessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
