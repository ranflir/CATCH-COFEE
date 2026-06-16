'use client';

import { ApiRequestError } from '@catch-coffee/types';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createApiClient } from '@/lib/api';
import { RoleGate } from '@/components/role-gate';

type PaymentMethod = {
  id: string;
  type: 'naverpay' | 'kakaopay' | 'card' | 'other';
  label: string;
  isDefault: boolean;
};

export default function PaymentMethodsPage() {
  const client = useMemo(() => createApiClient(), []);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    type: 'kakaopay' as PaymentMethod['type'],
    label: '',
    isDefault: false,
  });

  const loadMethods = useCallback(async () => {
    const data = await client.request<PaymentMethod[]>('/api/v1/me/payment-methods');
    setMethods(data);
  }, [client]);

  useEffect(() => {
    void (async () => {
      try {
        await loadMethods();
      } catch {
        setError('결제수단을 불러오지 못했습니다.');
      }
    })();
  }, [loadMethods]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await client.request('/api/v1/me/payment-methods', {
        method: 'POST',
        body: form,
      });
      setMessage('결제수단을 등록했습니다.');
      setForm({ type: 'kakaopay', label: '', isDefault: false });
      await loadMethods();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '등록에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('이 결제수단을 삭제할까요?')) return;
    setPending(true);
    try {
      await client.request(`/api/v1/me/payment-methods/${id}`, { method: 'DELETE' });
      await loadMethods();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '삭제에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  return (
    <RoleGate allowed={['user', 'seller', 'admin']}>
      <div className="stack">
        <h1>결제수단</h1>
        <section className="card stack">
          <h2>등록</h2>
          <form className="stack" onSubmit={onSubmit}>
            <label className="label">
              종류
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, type: e.target.value as PaymentMethod['type'] }))
                }
              >
                <option value="kakaopay">카카오페이</option>
                <option value="naverpay">네이버페이</option>
                <option value="card">카드</option>
                <option value="other">기타</option>
              </select>
            </label>
            <label className="label">
              별칭
              <input
                required
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              />
            </label>
            <label className="label">
              <span>
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                />{' '}
                기본 결제수단
              </span>
            </label>
            <button type="submit" disabled={pending}>
              등록
            </button>
          </form>
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
        </section>
        <section className="card stack">
          <h2>내 결제수단</h2>
          {methods.length === 0 ? (
            <p className="muted">등록된 결제수단이 없습니다.</p>
          ) : (
            <ul className="item-list">
              {methods.map((method) => (
                <li key={method.id} className="item-row">
                  <div>
                    <strong>{method.label}</strong>
                    <p className="muted">
                      {method.type}
                      {method.isDefault ? ' · 기본' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={pending}
                    onClick={() => void onDelete(method.id)}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </RoleGate>
  );
}
