import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="stack">
      <section className="card">
        <h1>내 주변 카페 할인</h1>
        <p className="muted">
          위치 기반 할인 정보 · 결제수단 추천 · 사용자 제보
        </p>
        <div className="stack" style={{ marginTop: '1rem' }}>
          <Link href="/cafes" className="btn">
            카페 찾기
          </Link>
          <Link href="/reports/new">할인 정보 제보하기</Link>
        </div>
      </section>
    </div>
  );
}
