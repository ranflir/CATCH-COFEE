'use client';

import { ApiRequestError } from '@catch-coffee/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth-provider';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await signup({
        email: String(form.get('email')),
        password: String(form.get('password')),
        name: String(form.get('name')),
      });
      router.push('/cafes');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '가입 실패');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card stack" style={{ maxWidth: 420 }}>
      <h1>회원가입</h1>
      <form className="stack" onSubmit={onSubmit}>
        <label className="label">
          이름
          <input name="name" required maxLength={100} />
        </label>
        <label className="label">
          이메일
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="label">
          비밀번호 (8자 이상)
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? '가입 중…' : '가입하기'}
        </button>
      </form>
      <p className="muted">
        이미 계정이 있나요? <Link href="/login">로그인</Link>
      </p>
    </div>
  );
}
