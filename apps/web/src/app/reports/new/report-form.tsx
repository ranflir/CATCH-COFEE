'use client';

import { ApiRequestError } from '@catch-coffee/types';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ReceiptUpload } from '@/components/receipt-upload';
import { useAuth } from '@/lib/auth-provider';
import { createApiClient } from '@/lib/api';

export default function NewReportPage() {
  const searchParams = useSearchParams();
  const initialCafeId = searchParams.get('cafeId') ?? '';
  const { accessToken, isReady } = useAuth();
  const router = useRouter();

  const [cafeId, setCafeId] = useState(initialCafeId);
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!isReady) return <p className="muted">준비 중…</p>;

  if (!accessToken) {
    return (
      <div className="card stack">
        <p>제보하려면 로그인이 필요합니다.</p>
        <Link href="/login">로그인</Link>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!receiptImageUrl) {
      setError('영수증 이미지를 업로드해 주세요.');
      return;
    }
    if (!cafeId.trim()) {
      setError('카페 ID를 입력해 주세요.');
      return;
    }

    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const client = createApiClient();

    try {
      await client.request(`/api/v1/cafes/${cafeId.trim()}/reports`, {
        method: 'POST',
        body: {
          title: String(form.get('title')),
          discountType: String(form.get('discountType')),
          discountValue: Number(form.get('discountValue')),
          infoSource: String(form.get('infoSource')),
          receiptImageUrl,
        },
      });
      router.push('/cafes');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '제보 등록 실패');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card stack" style={{ maxWidth: 560 }}>
      <h1>할인 제보</h1>
      <form className="stack" onSubmit={onSubmit}>
        <label className="label">
          카페 ID
          <input
            value={cafeId}
            onChange={(e) => setCafeId(e.target.value)}
            required
            placeholder="카페 상세 페이지 URL의 ID"
          />
        </label>
        <label className="label">
          할인 제목
          <input name="title" required maxLength={200} />
        </label>
        <label className="label">
          할인 유형
          <select name="discountType" defaultValue="percentage">
            <option value="percentage">정률 (%)</option>
            <option value="amount">정액 (원)</option>
          </select>
        </label>
        <label className="label">
          할인 값
          <input name="discountValue" type="number" min={1} step={1} required />
        </label>
        <label className="label">
          정보 출처
          <select name="infoSource" defaultValue="receipt">
            <option value="receipt">영수증</option>
            <option value="offline">매장 확인</option>
            <option value="store_notice">매장 공지</option>
            <option value="witnessed">직접 목격</option>
          </select>
        </label>

        <ReceiptUpload onUploaded={setReceiptImageUrl} disabled={pending} />
        {receiptImageUrl && (
          <p className="muted">업로드 완료: {receiptImageUrl.slice(0, 48)}…</p>
        )}

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={pending || !receiptImageUrl}>
          {pending ? '등록 중…' : '제보 등록'}
        </button>
      </form>
    </div>
  );
}
