'use client';

import { useEffect, useMemo, useState } from 'react';
import { createApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';

type Recommendation = {
  cafeId: string;
  recommended: {
    discountId: string;
    title: string;
    paymentType: string | null;
    discountType: string;
    value: number;
  } | null;
  recommendedPaymentType: string | null;
  candidates: Array<{ title: string; discountType: string; value: number }>;
  note: string;
};

export function PaymentRecommendation({ cafeId }: { cafeId: string }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => createApiClient(), []);
  const [data, setData] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      try {
        const result = await client.request<Recommendation>(
          `/api/v1/cafes/${cafeId}/recommendation`,
        );
        setData(result);
      } catch {
        setError('결제 추천을 불러오지 못했습니다.');
      }
    })();
  }, [accessToken, cafeId, client]);

  if (!accessToken) {
    return (
      <section className="card stack">
        <h2>결제 추천</h2>
        <p className="muted">로그인 후 보유 결제수단 기준 추천을 확인할 수 있습니다.</p>
      </section>
    );
  }

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">추천 불러오는 중…</p>;

  return (
    <section className="card stack">
      <h2>결제 추천</h2>
      {data.recommended ? (
        <p>
          <strong>{data.recommended.title}</strong>
          {data.recommended.discountType === 'percentage'
            ? ` — ${data.recommended.value}%`
            : ` — ${data.recommended.value}원`}
          {data.recommendedPaymentType && (
            <span className="muted"> ({data.recommendedPaymentType} 권장)</span>
          )}
        </p>
      ) : (
        <p className="muted">적용 가능한 할인이 없습니다. 결제수단을 등록해 보세요.</p>
      )}
      <p className="muted">{data.note}</p>
    </section>
  );
}
