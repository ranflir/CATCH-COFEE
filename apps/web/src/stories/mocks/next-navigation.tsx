'use client';

const router = {
  replace: () => {},
  push: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: async () => {},
};

export function useRouter() {
  return router;
}

export function usePathname() {
  return '/';
}

export function useSearchParams() {
  return new URLSearchParams();
}
