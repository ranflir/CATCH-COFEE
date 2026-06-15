'use client';

import { ApiRequestError } from '@catch-coffee/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth-provider';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get('email')), String(form.get('password')));
      router.push('/cafes');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '로그인 실패');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card stack" style={{ maxWidth: 420 }}>
      <h1>로그인</h1>
      <form className="stack" onSubmit={onSubmit}>
        <label className="label">
          이메일
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="label">
          비밀번호
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? '로그인 중…' : '로그인'}
        </button>
      </form>
      <p className="muted">
        계정이 없나요? <Link href="/signup">회원가입</Link>
      </p>
    </div>
  );
}
