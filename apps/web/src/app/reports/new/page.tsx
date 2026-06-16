import { Suspense } from 'react';
import NewReportPage from './report-form';

export default function Page() {
  return (
    <Suspense fallback={<p className="muted">준비 중…</p>}>
      <NewReportPage />
    </Suspense>
  );
}
