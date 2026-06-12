import { logError } from '../logger';

const EXPO_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const CHUNK_SIZE = 100;

export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export function chunk<T>(items: T[], size = CHUNK_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** 유효한 Expo 토큰만 메시지로 변환. */
export function buildExpoMessages(tokens: string[], payload: PushPayload): ExpoMessage[] {
  return tokens
    .filter((t) => t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'))
    .map((to) => ({ to, title: payload.title, body: payload.body, data: payload.data }));
}

/**
 * Expo push API로 전송. 100개 단위 청크. 전송 실패는 로그로 흡수(비차단).
 */
export async function sendExpoPush(messages: ExpoMessage[]): Promise<void> {
  if (messages.length === 0) {
    return;
  }
  const accessToken = process.env.EXPO_ACCESS_TOKEN;

  for (const batch of chunk(messages)) {
    try {
      const res = await fetch(EXPO_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        logError('expo push non-ok response', `HTTP ${res.status}`);
      }
    } catch (err) {
      logError('expo push request failed', err);
    }
  }
}
