import type { Decorator } from '@storybook/react';
import { useEffect } from 'react';
import { saveStoredAuth } from '@catch-coffee/types';
import { AuthProvider } from '@/stories/mocks/mock-auth-provider';
import type { UserProfile } from '@/lib/user-profile';

export function withMockAuth(user: UserProfile | null): Decorator {
  function WithMockAuth(Story: Parameters<Decorator>[0]) {
    return (
      <AuthProvider user={user}>
        <Story />
      </AuthProvider>
    );
  }
  return WithMockAuth;
}

function AuthTokenStory({ Story }: { Story: Parameters<Decorator>[0] }) {
  useEffect(() => {
    saveStoredAuth({ accessToken: 'storybook-mock-token', refreshToken: 'storybook-mock-refresh' });
    return () => saveStoredAuth(null);
  }, []);
  return <Story />;
}

export const withAuthToken: Decorator = (Story) => <AuthTokenStory Story={Story} />;

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
