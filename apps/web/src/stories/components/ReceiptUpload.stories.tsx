import type { Meta, StoryObj } from '@storybook/react';
import { ReceiptUpload } from '@/components/receipt-upload';

const meta = {
  title: 'Components/ReceiptUpload',
  component: ReceiptUpload,
  args: {
    onUploaded: () => {},
  },
} satisfies Meta<typeof ReceiptUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};
