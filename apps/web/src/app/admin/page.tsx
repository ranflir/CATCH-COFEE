export default function AdminHomePage() {
  return (
    <div className="card stack">
      <h1>관리자</h1>
      <p className="muted">
        제보 검수·크롤 후보 검수 UI는 다음 단계에서 구현합니다. (API:{' '}
        <code>/api/v1/admin/reports</code>,{' '}
        <code>/api/v1/admin/crawl-candidates</code>)
      </p>
    </div>
  );
}
