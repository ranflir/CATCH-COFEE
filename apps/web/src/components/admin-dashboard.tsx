'use client';

import { ApiRequestError } from '@catch-coffee/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createApiClient } from '@/lib/api';
import type { AdminReport } from '@/lib/user-profile';

function formatDiscount(report: AdminReport): string {
  const value = Number(report.discountValue);
  return report.discountType === 'percentage' ? `${value}%` : `${value}원`;
}

export function AdminDashboard() {
  const client = useMemo(() => createApiClient(), []);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    const data = await client.request<AdminReport[]>('/api/v1/admin/reports');
    setReports(data);
  }, [client]);

  useEffect(() => {
    void (async () => {
      try {
        await loadReports();
      } catch {
        setError('검수 대기 제보를 불러오지 못했습니다.');
      }
    })();
  }, [loadReports]);

  async function onApprove(id: string) {
    setPendingId(id);
    setError(null);
    setMessage(null);
    try {
      await client.request(`/api/v1/admin/reports/${id}/approve`, { method: 'POST' });
      setMessage('제보를 승인했습니다.');
      await loadReports();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '승인에 실패했습니다.');
    } finally {
      setPendingId(null);
    }
  }

  async function onReject(id: string) {
    const reason = window.prompt('반려 사유를 입력하세요.');
    if (!reason?.trim()) return;

    setPendingId(id);
    setError(null);
    setMessage(null);
    try {
      await client.request(`/api/v1/admin/reports/${id}/reject`, {
        method: 'POST',
        body: { reason: reason.trim() },
      });
      setMessage('제보를 반려했습니다.');
      await loadReports();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '반려에 실패했습니다.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="stack">
      <section className="card stack">
        <h1>제보 검수</h1>
        <p className="muted">대기·검수 중 제보를 승인하거나 반려합니다.</p>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card stack">
        {reports.length === 0 ? (
          <p className="muted">검수 대기 제보가 없습니다.</p>
        ) : (
          <ul className="item-list">
            {reports.map((report) => (
              <li key={report.id} className="item-row stack">
                <div>
                  <strong>{report.title}</strong>
                  <p className="muted">
                    {formatDiscount(report)} · 카페 {report.cafeId} · {report.status}
                  </p>
                  <p className="muted">
                    확인 {report.confirmCount}회 · 출처 {report.infoSource}
                  </p>
                  <a href={report.receiptImageUrl} target="_blank" rel="noreferrer">
                    영수증 보기
                  </a>
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    disabled={pendingId === report.id}
                    onClick={() => void onApprove(report.id)}
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={pendingId === report.id}
                    onClick={() => void onReject(report.id)}
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
