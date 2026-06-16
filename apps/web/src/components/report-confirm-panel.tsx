'use client';

import { ApiRequestError } from '@catch-coffee/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createApiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';

type PendingReport = {
  id: string;
  title: string;
  discountType: 'percentage' | 'amount';
  discountValue: string | number;
  confirmCount: number;
  status: string;
};

type ConfirmState = {
  reportId: string;
  status: string;
  confirmCount: number;
  autoRegistered: boolean;
};

function formatDiscount(report: PendingReport): string {
  const value = Number(report.discountValue);
  return report.discountType === 'percentage' ? `${value}%` : `${value}원`;
}

export function ReportConfirmPanel({ cafeId }: { cafeId: string }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => createApiClient(), []);
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    const data = await client.request<PendingReport[]>(
      `/api/v1/cafes/${cafeId}/reports/pending`,
    );
    setReports(data);
  }, [cafeId, client]);

  useEffect(() => {
    void (async () => {
      try {
        await loadReports();
      } catch {
        setError('제보 목록을 불러오지 못했습니다.');
      }
    })();
  }, [loadReports]);

  async function onConfirm(reportId: string) {
    if (!accessToken) {
      setError('로그인 후 확인할 수 있습니다.');
      return;
    }
    setPendingId(reportId);
    setError(null);
    setMessage(null);
    try {
      const result = await client.request<ConfirmState>(`/api/v1/reports/${reportId}/confirm`, {
        method: 'POST',
      });
      setMessage(
        result.autoRegistered
          ? `3인 확인 완료 — 할인이 자동 등록되었습니다. (${result.confirmCount}명)`
          : `확인했습니다. (${result.confirmCount}/3)`,
      );
      await loadReports();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '확인에 실패했습니다.');
    } finally {
      setPendingId(null);
    }
  }

  if (reports.length === 0 && !error) {
    return null;
  }

  return (
    <section className="card stack">
      <h2>제보 확인</h2>
      <p className="muted">다른 사용자 제보에 &quot;이 정보 맞아요&quot;를 눌러 주세요. 3명 확인 시 자동 등록됩니다.</p>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <ul className="item-list">
        {reports.map((report) => (
          <li key={report.id} className="item-row">
            <div>
              <strong>{report.title}</strong>
              <p className="muted">
                {formatDiscount(report)} · 확인 {report.confirmCount}/3
              </p>
            </div>
            <button
              type="button"
              disabled={!accessToken || pendingId === report.id}
              onClick={() => void onConfirm(report.id)}
            >
              {accessToken ? '이 정보 맞아요' : '로그인 필요'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
