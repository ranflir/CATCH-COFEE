'use client';

import { ApiRequestError } from '@catch-coffee/types';
import { useEffect, useMemo, useState } from 'react';
import { createApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';

export function FavoriteButton({ cafeId }: { cafeId: string }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => createApiClient(), []);
  const [favorited, setFavorited] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      try {
        const list = await client.request<Array<{ cafe: { id: string } }>>('/api/v1/me/favorites');
        setFavorited(list.some((f) => f.cafe.id === cafeId));
      } catch {
        /* ignore */
      }
    })();
  }, [accessToken, cafeId, client]);

  async function toggleFavorite() {
    if (!accessToken) {
      setError('로그인 후 즐겨찾기할 수 있습니다.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (favorited) {
        await client.request(`/api/v1/cafes/${cafeId}/favorites`, { method: 'DELETE' });
        setFavorited(false);
      } else {
        await client.request(`/api/v1/cafes/${cafeId}/favorites`, {
          method: 'POST',
          body: { notifyEnabled: true },
        });
        setFavorited(true);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '즐겨찾기 처리 실패');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <button type="button" className="btn-secondary" disabled={pending} onClick={() => void toggleFavorite()}>
        {favorited ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
