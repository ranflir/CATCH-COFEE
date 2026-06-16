'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createApiClient } from '@/lib/api';
import { RoleGate } from '@/components/role-gate';

type FavoriteItem = {
  cafe: { id: string; name: string; address?: string | null };
  notifyEnabled: boolean;
  createdAt: string;
};

export default function FavoritesPage() {
  const client = useMemo(() => createApiClient(), []);
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await client.request<FavoriteItem[]>('/api/v1/me/favorites');
        setItems(data);
      } catch {
        setError('즐겨찾기를 불러오지 못했습니다.');
      }
    })();
  }, [client]);

  return (
    <RoleGate allowed={['user', 'seller', 'admin']}>
      <div className="stack">
        <h1>즐겨찾기</h1>
        {error && <p className="error">{error}</p>}
        {items.length === 0 ? (
          <p className="muted">즐겨찾기한 카페가 없습니다.</p>
        ) : (
          <div className="grid two">
            {items.map((item) => (
              <Link key={item.cafe.id} href={`/cafes/${item.cafe.id}`} className="card">
                <strong>{item.cafe.name}</strong>
                {item.cafe.address && <p className="muted">{item.cafe.address}</p>}
                <p className="muted">알림 {item.notifyEnabled ? '켜짐' : '꺼짐'}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RoleGate>
  );
}
