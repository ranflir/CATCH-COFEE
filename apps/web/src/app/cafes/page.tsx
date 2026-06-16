'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { KakaoCafeMap } from '@/components/kakao-cafe-map';
import { createApiClient } from '@/lib/api';

type CafeItem = {
  id: string;
  name: string;
  address?: string | null;
  distanceM?: number;
};

type SearchResult = {
  items: CafeItem[];
  meta: { page: number; limit: number; count: number };
};

export default function CafesPage() {
  const [items, setItems] = useState<CafeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const client = createApiClient();

      const runSearch = (params: URLSearchParams) =>
        client.request<SearchResult>(`/api/v1/cafes?${params.toString()}`);

      try {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              if (cancelled) return;
              try {
                const params = new URLSearchParams({
                  lat: String(pos.coords.latitude),
                  lng: String(pos.coords.longitude),
                  radius: '3000',
                  sort: 'distance',
                  limit: '20',
                });
                const data = await runSearch(params);
                if (!cancelled) setItems(data.items);
              } catch {
                if (!cancelled) setError('카페 목록을 불러오지 못했습니다.');
              } finally {
                if (!cancelled) setLoading(false);
              }
            },
            async () => {
              if (cancelled) return;
              try {
                const data = await runSearch(new URLSearchParams({ limit: '20' }));
                if (!cancelled) setItems(data.items);
              } catch {
                if (!cancelled) setError('카페 목록을 불러오지 못했습니다.');
              } finally {
                if (!cancelled) setLoading(false);
              }
            },
          );
        } else {
          const data = await runSearch(new URLSearchParams({ limit: '20' }));
          if (!cancelled) setItems(data.items);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setError('카페 목록을 불러오지 못했습니다.');
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="stack">
      <h1>주변 카페</h1>
      <KakaoCafeMap />
      {loading && <p className="muted">목록 불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      <div className="grid two">
        {items.map((cafe) => (
          <Link key={cafe.id} href={`/cafes/${cafe.id}`} className="card">
            <strong>{cafe.name}</strong>
            {cafe.address && <p className="muted">{cafe.address}</p>}
            {cafe.distanceM != null && (
              <p className="muted">{Math.round(cafe.distanceM)}m</p>
            )}
          </Link>
        ))}
      </div>
      {!loading && items.length === 0 && !error && (
        <p className="muted">표시할 카페가 없습니다. 시드 데이터를 확인하세요.</p>
      )}
    </div>
  );
}
