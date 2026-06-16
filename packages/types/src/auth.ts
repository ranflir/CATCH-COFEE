export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type StoredAuth = AuthTokens & {
  expiresAt?: number;
};

const STORAGE_KEY = 'catch-coffee.auth';

/** 브라우저 localStorage 기반 (웹). SSR 환경에서는 no-op. */
export function loadStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth: StoredAuth | null): void {
  if (typeof window === 'undefined') return;
  if (!auth) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function getAccessToken(): string | null {
  return loadStoredAuth()?.accessToken ?? null;
}
