'use client';

import { ApiRequestError } from '@catch-coffee/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createApiClient } from '@/lib/api';

export type CrawlCandidate = {
  id: string;
  sourceId: string | null;
  cafeId: string | null;
  rawText: string | null;
  parsed: {
    title?: string;
    discountType?: string;
    discountValue?: number;
  } | null;
  status: string;
  createdAt: string;
};

function formatParsed(candidate: CrawlCandidate): string {
  const parsed = candidate.parsed;
  if (!parsed?.title) return candidate.rawText ?? '(파싱 없음)';
  if (parsed.discountType === 'percentage') return `${parsed.title} (${parsed.discountValue}%)`;
  if (parsed.discountType === 'amount') return `${parsed.title} (${parsed.discountValue}원)`;
  return parsed.title;
}

export function AdminCrawlDashboard() {
  const client = useMemo(() => createApiClient(), []);
  const [candidates, setCandidates] = useState<CrawlCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    const data = await client.request<CrawlCandidate[]>('/api/v1/admin/crawl-candidates');
    setCandidates(data);
  }, [client]);

  useEffect(() => {
    void (async () => {
      try {
        await loadCandidates();
      } catch {
        setError('크롤 후보를 불러오지 못했습니다.');
      }
    })();
  }, [loadCandidates]);

  async function onApprove(id: string) {
    setPendingId(id);
    setError(null);
    setMessage(null);
    try {
      await client.request(`/api/v1/admin/crawl-candidates/${id}/approve`, {
        method: 'POST',
        body: {},
      });
      setMessage('크롤 후보를 승인했습니다.');
      await loadCandidates();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '승인에 실패했습니다.');
    } finally {
      setPendingId(null);
    }
  }

  async function onReject(id: string) {
    const reason = window.prompt('반려 사유 (선택)');
    setPendingId(id);
    setError(null);
    setMessage(null);
    try {
      await client.request(`/api/v1/admin/crawl-candidates/${id}/reject`, {
        method: 'POST',
        body: { reason: reason?.trim() || undefined },
      });
      setMessage('크롤 후보를 반려했습니다.');
      await loadCandidates();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '반려에 실패했습니다.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="stack">
      <section className="card stack">
        <h2>크롤 후보 검수</h2>
        <p className="muted">자동 수집 파싱 결과를 승인하거나 반려합니다.</p>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>
      <section className="card stack">
        {candidates.length === 0 ? (
          <p className="muted">검수 대기 크롤 후보가 없습니다.</p>
        ) : (
          <ul className="item-list">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="item-row stack">
                <div>
                  <strong>{formatParsed(candidate)}</strong>
                  <p className="muted">
                    카페 {candidate.cafeId ?? '미지정'} · {candidate.status}
                  </p>
                  {candidate.rawText && <p className="muted">{candidate.rawText}</p>}
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    disabled={pendingId === candidate.id}
                    onClick={() => void onApprove(candidate.id)}
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={pendingId === candidate.id}
                    onClick={() => void onReject(candidate.id)}
                  >
                    반려
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
