'use client';

import { RoleGate } from '@/components/role-gate';
import { SellerDashboard } from '@/components/seller-dashboard';

export default function SellerHomePage() {
  return (
    <RoleGate allowed={['seller', 'admin']}>
      <SellerDashboard />
    </RoleGate>
  );
}
