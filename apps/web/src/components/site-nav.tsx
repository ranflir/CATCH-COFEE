import Link from 'next/link';

export function SiteNav() {
  return (
    <nav className="site-nav">
      <Link href="/" className="brand">
        Catch Coffee
      </Link>
      <div className="links">
        <Link href="/cafes">카페</Link>
        <Link href="/reports/new">제보</Link>
        <Link href="/seller">셀러</Link>
        <Link href="/admin">관리</Link>
        <Link href="/login">로그인</Link>
      </div>
    </nav>
  );
}
