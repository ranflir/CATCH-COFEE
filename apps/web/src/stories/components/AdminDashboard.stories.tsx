import type { Meta, StoryObj } from '@storybook/react';
import { AdminDashboard } from '@/components/admin-dashboard';
import { withAuthToken, withMockAuth, adminUser } from '@/stories/decorators';

const meta: Meta<typeof AdminDashboard> = {
  title: 'Dashboards/AdminDashboard',
  component: AdminDashboard,
  decorators: [withMockAuth(adminUser), withAuthToken],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReportQueue: Story = {};
