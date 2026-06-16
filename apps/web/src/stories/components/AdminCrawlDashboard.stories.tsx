import type { Meta, StoryObj } from '@storybook/react';
import { AdminCrawlDashboard } from '@/components/admin-crawl-dashboard';
import { withAuthToken, withMockAuth, adminUser } from '@/stories/decorators';

const meta: Meta<typeof AdminCrawlDashboard> = {
  title: 'Dashboards/AdminCrawlDashboard',
  component: AdminCrawlDashboard,
  decorators: [withMockAuth(adminUser), withAuthToken],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PendingQueue: Story = {};
