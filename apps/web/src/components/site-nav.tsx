'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-provider';

export function SiteNav() {
  const { isReady, accessToken, user, logout } = useAuth();

  return (
    <nav className="site-nav">
      <Link href="/" className="brand">
        Catch Coffee
      </Link>
      <div className="links">
        <Link href="/cafes">카페</Link>
        <Link href="/reports/new">제보</Link>
        <Link href="/me/favorites">즐겨찾기</Link>
        <Link href="/me/payment-methods">결제수단</Link>
        {(user?.role === 'seller' || user?.role === 'admin') && (
          <Link href="/seller">셀러</Link>
        )}
        {user?.role === 'admin' && <Link href="/admin">관리</Link>}
        {!isReady ? null : accessToken ? (
          <>
            <span className="muted">{user?.name ?? '…'}</span>
            <button type="button" className="btn-link" onClick={logout}>
              로그아웃
            </button>
          </>
        ) : (
          <Link href="/login">로그인</Link>
        )}
      </div>
    </nav>
  );
}
