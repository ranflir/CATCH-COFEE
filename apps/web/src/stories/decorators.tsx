import type { Decorator } from '@storybook/react';
import { useEffect } from 'react';
import { saveStoredAuth } from '@catch-coffee/types';
import { AuthProvider } from '@/stories/mocks/mock-auth-provider';
import type { UserProfile } from '@/lib/user-profile';

export const withMockAuth =
  (user: UserProfile | null): Decorator =>
  (Story) => (
    <AuthProvider user={user}>
      <Story />
    </AuthProvider>
  );

export const withAuthToken: Decorator = (Story) => {
  useEffect(() => {
    saveStoredAuth({ accessToken: 'storybook-mock-token', refreshToken: 'storybook-mock-refresh' });
    return () => saveStoredAuth(null);
  }, []);
  return <Story />;
};

export const adminUser: UserProfile = {
  id: 'seed_user_admin',
  email: 'admin@catch.coffee',
  name: '테스트 관리자',
  phone: null,
  role: 'admin',
  trustScore: 0,
  createdAt: new Date().toISOString(),
};

export const sellerUser: UserProfile = {
  id: 'seed_user_seller',
  email: 'seller@catch.coffee',
  name: '테스트 셀러',
  phone: null,
  role: 'seller',
  trustScore: 0,
  createdAt: new Date().toISOString(),
};

export const regularUser: UserProfile = {
  id: 'seed_user_demo',
  email: 'demo@catch.coffee',
  name: '데모 사용자',
  phone: null,
  role: 'user',
  trustScore: 0,
  createdAt: new Date().toISOString(),
};
