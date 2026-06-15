import { ApiClient } from '@catch-coffee/types';
import { getAccessToken } from '@catch-coffee/types';

export function createApiClient(): ApiClient {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  return new ApiClient({
    baseUrl,
    getAccessToken,
  });
}

export const api = createApiClient();
