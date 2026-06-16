'use client';

import { ApiRequestError } from '@catch-coffee/types';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createApiClient } from '@/lib/api';
import type { OwnedCafe, SellerDiscount } from '@/lib/user-profile';

type DiscountForm = {
  title: string;
  discountType: 'percentage' | 'amount';
  discountValue: string;
  targetScope: 'all' | 'menu';
  paymentType: '' | 'naverpay' | 'kakaopay' | 'card' | 'other';
  status: 'scheduled' | 'active' | 'ended' | 'hidden';
};

const emptyForm: DiscountForm = {
  title: '',
  discountType: 'percentage',
  discountValue: '',
  targetScope: 'all',
  paymentType: '',
  status: 'active',
};

function formatDiscountValue(discount: SellerDiscount): string {
  const value = Number(discount.discountValue);
  return discount.discountType === 'percentage' ? `${value}%` : `${value}원`;
}

export function SellerDashboard() {
  const client = useMemo(() => createApiClient(), []);
  const [cafes, setCafes] = useState<OwnedCafe[]>([]);
  const [cafeId, setCafeId] = useState('');
  const [discounts, setDiscounts] = useState<SellerDiscount[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DiscountForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const loadCafes = useCallback(async () => {
    const data = await client.request<OwnedCafe[]>('/api/v1/me/cafes');
    setCafes(data);
    if (data.length > 0 && !cafeId) {
      setCafeId(data[0]!.id);
    }
  }, [cafeId, client]);

  const loadDiscounts = useCallback(
    async (selectedCafeId: string) => {
      const data = await client.request<SellerDiscount[]>(
        `/api/v1/cafes/${selectedCafeId}/discounts/manage`,
      );
      setDiscounts(data);
    },
    [client],
  );

  useEffect(() => {
    void (async () => {
      try {
        await loadCafes();
      } catch {
        setError('관리 가능한 카페를 불러오지 못했습니다.');
      }
    })();
  }, [loadCafes]);

  useEffect(() => {
    if (!cafeId) return;
    void (async () => {
      try {
        await loadDiscounts(cafeId);
      } catch {
        setError('할인 목록을 불러오지 못했습니다.');
      }
    })();
  }, [cafeId, loadDiscounts]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(discount: SellerDiscount) {
    setEditingId(discount.id);
    setForm({
      title: discount.title,
      discountType: discount.discountType,
      discountValue: String(discount.discountValue),
      targetScope: discount.targetScope,
      paymentType: (discount.paymentType as DiscountForm['paymentType']) ?? '',
      status: discount.status,
    });
    setMessage(null);
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cafeId) return;

    setPending(true);
    setError(null);
    setMessage(null);

    const body = {
      title: form.title.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      targetScope: form.targetScope,
      ...(form.paymentType ? { paymentType: form.paymentType } : {}),
      ...(editingId ? { status: form.status } : {}),
    };

    try {
      if (editingId) {
        await client.request(`/api/v1/discounts/${editingId}`, {
          method: 'PATCH',
          body,
        });
        setMessage('할인을 수정했습니다.');
      } else {
        await client.request(`/api/v1/cafes/${cafeId}/discounts`, {
          method: 'POST',
          body,
        });
        setMessage('할인을 등록했습니다.');
      }
      resetForm();
      await loadDiscounts(cafeId);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '저장에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: string) {
    if (!cafeId || !window.confirm('이 할인을 삭제할까요?')) return;
    setPending(true);
    setError(null);
    try {
      await client.request(`/api/v1/discounts/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      setMessage('할인을 삭제했습니다.');
      await loadDiscounts(cafeId);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '삭제에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <section className="card stack">
        <h1>셀러 대시보드</h1>
        <p className="muted">소유 카페의 할인을 등록·수정·삭제합니다.</p>
        {cafes.length === 0 ? (
          <p className="muted">관리 가능한 카페가 없습니다. 시드의 seller 계정을 확인하세요.</p>
        ) : (
          <label className="label">
            카페 선택
            <select value={cafeId} onChange={(e) => setCafeId(e.target.value)}>
              {cafes.map((cafe) => (
                <option key={cafe.id} value={cafe.id}>
                  {cafe.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      <section className="card stack">
        <h2>{editingId ? '할인 수정' : '할인 등록'}</h2>
        <form className="stack" onSubmit={onSubmit}>
          <label className="label">
            제목
            <input
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </label>
          <label className="label">
            할인 유형
            <select
              value={form.discountType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  discountType: e.target.value as DiscountForm['discountType'],
                }))
              }
            >
              <option value="percentage">정률 (%)</option>
              <option value="amount">정액 (원)</option>
            </select>
          </label>
          <label className="label">
            할인 값
            <input
              required
              type="number"
              min="1"
              max={form.discountType === 'percentage' ? '100' : undefined}
              value={form.discountValue}
              onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
            />
          </label>
          <label className="label">
            적용 범위
            <select
              value={form.targetScope}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  targetScope: e.target.value as DiscountForm['targetScope'],
                }))
              }
            >
              <option value="all">전체</option>
              <option value="menu">메뉴</option>
            </select>
          </label>
          <label className="label">
            결제수단 (선택)
            <select
              value={form.paymentType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  paymentType: e.target.value as DiscountForm['paymentType'],
                }))
              }
            >
              <option value="">무관</option>
              <option value="naverpay">네이버페이</option>
              <option value="kakaopay">카카오페이</option>
              <option value="card">카드</option>
              <option value="other">기타</option>
            </select>
          </label>
          {editingId && (
            <label className="label">
              상태
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as DiscountForm['status'],
                  }))
                }
              >
                <option value="scheduled">예약</option>
                <option value="active">진행</option>
                <option value="ended">종료</option>
                <option value="hidden">숨김</option>
              </select>
            </label>
          )}
          <div className="row-actions">
            <button type="submit" disabled={pending || !cafeId}>
              {pending ? '저장 중…' : editingId ? '수정 저장' : '등록'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                취소
              </button>
            )}
          </div>
        </form>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card stack">
        <h2>등록된 할인</h2>
        {discounts.length === 0 ? (
          <p className="muted">등록된 할인이 없습니다.</p>
        ) : (
          <ul className="item-list">
            {discounts.map((discount) => (
              <li key={discount.id} className="item-row">
                <div>
                  <strong>{discount.title}</strong>
                  <p className="muted">
                    {formatDiscountValue(discount)} · {discount.status}
                  </p>
                </div>
                <div className="row-actions">
                  <button type="button" className="btn-secondary" onClick={() => startEdit(discount)}>
                    수정
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={pending}
                    onClick={() => void onDelete(discount.id)}
                  >
                    삭제
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
