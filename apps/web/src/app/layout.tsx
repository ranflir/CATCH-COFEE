import type { Metadata } from 'next';
import { SiteNav } from '@/components/site-nav';
import { AuthProvider } from '@/lib/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Catch Coffee',
  description: '주변 카페 할인, 가장 빠르게',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <SiteNav />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
