import type { Meta, StoryObj } from '@storybook/react';
import { RoleGate } from '@/components/role-gate';
import { AuthProvider } from '@/stories/mocks/mock-auth-provider';
import { adminUser, regularUser, sellerUser } from '@/stories/decorators';

const meta: Meta<typeof RoleGate> = {
  title: 'Components/RoleGate',
  component: RoleGate,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DeniedForUser: Story = {
  decorators: [
    (Story) => (
      <AuthProvider user={regularUser}>
        <Story />
      </AuthProvider>
    ),
  ],
  render: () => (
    <RoleGate allowed={['admin']}>
      <p>관리자 전용 콘텐츠</p>
    </RoleGate>
  ),
};

export const AllowedSeller: Story = {
  decorators: [
    (Story) => (
      <AuthProvider user={sellerUser}>
        <Story />
      </AuthProvider>
    ),
  ],
  render: () => (
    <RoleGate allowed={['seller', 'admin']}>
      <p>셀러 대시보드 콘텐츠</p>
    </RoleGate>
  ),
};

export const AllowedAdmin: Story = {
  decorators: [
    (Story) => (
      <AuthProvider user={adminUser}>
        <Story />
      </AuthProvider>
    ),
  ],
  render: () => (
    <RoleGate allowed={['admin']}>
      <p>관리자 콘텐츠</p>
    </RoleGate>
  ),
};

export const LoadingProfile: Story = {
  decorators: [
    (Story) => (
      <AuthProvider user={null} accessToken="mock-token" isReady>
        <Story />
      </AuthProvider>
    ),
  ],
  render: () => (
    <RoleGate allowed={['admin']}>
      <p>로딩 후 표시</p>
    </RoleGate>
  ),
};

export const CheckingAuth: Story = {
  decorators: [
    (Story) => (
      <AuthProvider user={null} accessToken={null} isReady={false}>
        <Story />
      </AuthProvider>
    ),
  ],
  render: () => (
    <RoleGate allowed={['admin']}>
      <p>인증 확인 중</p>
    </RoleGate>
  ),
};
