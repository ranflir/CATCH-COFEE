'use client';

import { useState } from 'react';
import { AdminCrawlDashboard } from '@/components/admin-crawl-dashboard';
import { AdminDashboard } from '@/components/admin-dashboard';
import { RoleGate } from '@/components/role-gate';

type AdminTab = 'reports' | 'crawl';

export default function AdminHomePage() {
  const [tab, setTab] = useState<AdminTab>('reports');

  return (
    <RoleGate allowed={['admin']}>
      <div className="stack">
        <section className="card stack">
          <h1>관리자</h1>
          <div className="row-actions">
            <button
              type="button"
              className={tab === 'reports' ? undefined : 'btn-secondary'}
              onClick={() => setTab('reports')}
            >
              제보 검수
            </button>
            <button
              type="button"
              className={tab === 'crawl' ? undefined : 'btn-secondary'}
              onClick={() => setTab('crawl')}
            >
              크롤 후보
            </button>
          </div>
        </section>
        {tab === 'reports' ? <AdminDashboard /> : <AdminCrawlDashboard />}
      </div>
    </RoleGate>
  );
}
