'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FavoriteButton } from '@/components/favorite-button';
import { PaymentRecommendation } from '@/components/payment-recommendation';
import { ReportConfirmPanel } from '@/components/report-confirm-panel';
import { createApiClient } from '@/lib/api';

type Cafe = {
  id: string;
  name: string;
  address?: string | null;
  lat: number;
  lng: number;
};

type DiscountsResponse = {
  cafeId: string;
  discounts: Record<
    string,
    Array<{ id: string; title: string; discountValue: number; discountType: string }>
  >;
};

export default function CafeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [discounts, setDiscounts] = useState<DiscountsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = createApiClient();
    void (async () => {
      try {
        const [cafeData, discountData] = await Promise.all([
          client.request<Cafe>(`/api/v1/cafes/${id}`),
          client.request<DiscountsResponse>(`/api/v1/cafes/${id}/discounts`),
        ]);
        setCafe(cafeData);
        setDiscounts(discountData);
      } catch {
        setError('카페 정보를 불러오지 못했습니다.');
      }
    })();
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!cafe) return <p className="muted">불러오는 중…</p>;

  const allDiscounts = Object.values(discounts?.discounts ?? {}).flat();

  return (
    <div className="stack">
      <Link href="/cafes" className="muted">
        ← 목록
      </Link>
      <section className="card stack">
        <h1>{cafe.name}</h1>
        {cafe.address && <p>{cafe.address}</p>}
        <FavoriteButton cafeId={cafe.id} />
        <Link href={`/reports/new?cafeId=${cafe.id}`}>이 카페 할인 제보</Link>
      </section>
      <ReportConfirmPanel cafeId={cafe.id} />
      <PaymentRecommendation cafeId={cafe.id} />
      <section className="card stack">
        <h2>할인</h2>
        {allDiscounts.length === 0 && (
          <p className="muted">등록된 할인이 없습니다.</p>
        )}
        <ul>
          {allDiscounts.map((d) => (
            <li key={d.id}>
              {d.title} —{' '}
              {d.discountType === 'percentage'
                ? `${d.discountValue}%`
                : `${d.discountValue}원`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
