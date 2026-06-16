import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthTokens, StoredAuth } from '@catch-coffee/types';

const STORAGE_KEY = 'catch-coffee.auth';

export async function loadStoredAuth(): Promise<StoredAuth | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export async function saveStoredAuth(auth: StoredAuth | null): Promise<void> {
  if (!auth) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export async function getAccessToken(): Promise<string | null> {
  const stored = await loadStoredAuth();
  return stored?.accessToken ?? null;
}

export type { AuthTokens, StoredAuth };
