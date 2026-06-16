import type { Meta, StoryObj } from '@storybook/react';
import { SellerDashboard } from '@/components/seller-dashboard';
import { withAuthToken, withMockAuth, sellerUser } from '@/stories/decorators';

const meta: Meta<typeof SellerDashboard> = {
  title: 'Dashboards/SellerDashboard',
  component: SellerDashboard,
  decorators: [withMockAuth(sellerUser), withAuthToken],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
