export type UserProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'user' | 'seller' | 'admin' | string;
  trustScore: number;
  createdAt: string;
};

export type OwnedCafe = {
  id: string;
  name: string;
  address?: string | null;
};

export type SellerDiscount = {
  id: string;
  cafeId: string;
  title: string;
  discountType: 'percentage' | 'amount';
  discountValue: string | number;
  targetScope: 'all' | 'menu';
  status: 'scheduled' | 'active' | 'ended' | 'hidden';
  paymentType?: string | null;
  startAt?: string | null;
  endAt?: string | null;
};

export type AdminReport = {
  id: string;
  cafeId: string;
  reporterId: string;
  title: string;
  discountType: 'percentage' | 'amount';
  discountValue: string | number;
  infoSource: string;
  receiptImageUrl: string;
  status: string;
  confirmCount: number;
  rejectReason?: string | null;
  createdAt: string;
};
