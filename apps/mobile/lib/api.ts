import { ApiClient } from '@catch-coffee/types';
import { getAccessToken } from './auth';

export function createApiClient(): ApiClient {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

  return new ApiClient({
    baseUrl,
    getAccessToken: () => {
      // ApiClient expects sync getter; token is loaded per-request in screens.
      return null;
    },
  });
}

export async function createAuthedApiClient(): Promise<ApiClient> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
  const token = await getAccessToken();

  return new ApiClient({
    baseUrl,
    getAccessToken: () => token,
  });
}
