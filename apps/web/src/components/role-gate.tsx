'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-provider';

type RoleGateProps = {
  allowed: Array<'user' | 'seller' | 'admin'>;
  children: ReactNode;
};

export function RoleGate({ allowed, children }: RoleGateProps) {
  const { isReady, accessToken, user, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (!user) {
      void refreshUser();
    }
  }, [isReady, accessToken, user, refreshUser, router]);

  if (!isReady || !accessToken) {
    return <p className="muted">인증 확인 중…</p>;
  }

  if (!user) {
    return <p className="muted">프로필 불러오는 중…</p>;
  }

  if (!allowed.includes(user.role as 'user' | 'seller' | 'admin')) {
    return (
      <div className="card stack">
        <p className="error">이 페이지에 접근할 권한이 없습니다.</p>
        <p className="muted">
          현재 역할: <code>{user.role}</code>
        </p>
        <Link href="/cafes">카페 목록으로</Link>
      </div>
    );
  }

  return children;
}
