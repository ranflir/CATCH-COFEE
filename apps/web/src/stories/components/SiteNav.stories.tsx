import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { SiteNav } from '@/components/site-nav';
import { AuthProvider } from '@/stories/mocks/mock-auth-provider';
import type { UserProfile } from '@/lib/user-profile';

const baseUser: UserProfile = {
  id: 'seed_user_demo',
  email: 'demo@catch.coffee',
  name: '데모 사용자',
  phone: null,
  role: 'user',
  trustScore: 0,
  createdAt: new Date().toISOString(),
};

const withAuth: Decorator = (Story, context) => (
  <AuthProvider user={(context.parameters.authUser as UserProfile | null) ?? null}>
    <Story />
  </AuthProvider>
);

const meta: Meta<typeof SiteNav> = {
  title: 'Components/SiteNav',
  component: SiteNav,
  decorators: [withAuth],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {
  parameters: { authUser: null },
};

export const LoggedInUser: Story = {
  parameters: { authUser: baseUser },
};

export const LoggedInSeller: Story = {
  parameters: {
    authUser: { ...baseUser, role: 'seller', name: '테스트 셀러' },
  },
};

export const LoggedInAdmin: Story = {
  parameters: {
    authUser: { ...baseUser, role: 'admin', name: '테스트 관리자' },
  },
};
