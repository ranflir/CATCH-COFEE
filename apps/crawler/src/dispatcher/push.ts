import { logError } from '../logger';

const EXPO_SEND_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_ENDPOINT = 'https://exp.host/--/api/v2/push/getReceipts';
const SEND_CHUNK_SIZE = 100;
const RECEIPT_CHUNK_SIZE = 1000;

/** 이 에러를 받은 토큰은 더 이상 유효하지 않으므로 정리(soft-delete) 대상. */
const PRUNABLE_ERRORS = new Set(['DeviceNotRegistered']);

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

/** push/send 응답의 개별 ticket */
export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/** push/getReceipts 응답의 개별 receipt */
export interface ExpoPushReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

export function chunk<T>(items: T[], size = SEND_CHUNK_SIZE): T[][] {
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

function authHeaders(): Record<string, string> {
  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  return {
    'content-type': 'application/json',
    accept: 'application/json',
    ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
  };
}

/**
 * Expo push/send 호출. 100개 단위 청크.
 * 입력 messages 와 같은 순서/길이의 ticket 배열을 반환(전송 실패도 error ticket 으로 채워 정렬 유지).
 */
export async function sendExpoPush(messages: ExpoMessage[]): Promise<ExpoPushTicket[]> {
  const tickets: ExpoPushTicket[] = [];
  if (messages.length === 0) {
    return tickets;
  }

  for (const batch of chunk(messages)) {
    let batchTickets: ExpoPushTicket[] = [];
    try {
      const res = await fetch(EXPO_SEND_ENDPOINT, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: ExpoPushTicket[] };
        batchTickets = json.data ?? [];
      } else {
        logError('expo push non-ok response', `HTTP ${res.status}`);
      }
    } catch (err) {
      logError('expo push request failed', err);
    }
    // ticket 누락 시 error 로 채워 messages 와 인덱스 정렬 유지
    for (let i = 0; i < batch.length; i += 1) {
      tickets.push(batchTickets[i] ?? { status: 'error', message: 'missing ticket' });
    }
  }
  return tickets;
}

/** send 단계에서 즉시 판별되는 무효 토큰(예: DeviceNotRegistered) 추출. */
export function collectInvalidTokensFromTickets(
  messages: ExpoMessage[],
  tickets: ExpoPushTicket[],
): string[] {
  const invalid: string[] = [];
  tickets.forEach((ticket, i) => {
    if (
      ticket.status === 'error' &&
      ticket.details?.error &&
      PRUNABLE_ERRORS.has(ticket.details.error)
    ) {
      const token = messages[i]?.to;
      if (token) invalid.push(token);
    }
  });
  return invalid;
}

/** 정상 접수된 ticket id 로 receipt 조회. id→receipt 맵 반환. */
export async function getExpoReceipts(
  ticketIds: string[],
): Promise<Record<string, ExpoPushReceipt>> {
  const out: Record<string, ExpoPushReceipt> = {};
  if (ticketIds.length === 0) {
    return out;
  }

  for (const batch of chunk(ticketIds, RECEIPT_CHUNK_SIZE)) {
    try {
      const res = await fetch(EXPO_RECEIPTS_ENDPOINT, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: batch }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        logError('expo receipts non-ok response', `HTTP ${res.status}`);
        continue;
      }
      const json = (await res.json()) as { data?: Record<string, ExpoPushReceipt> };
      Object.assign(out, json.data ?? {});
    } catch (err) {
      logError('expo receipts request failed', err);
    }
  }
  return out;
}

/** receipt 단계에서 판별되는 무효 토큰 추출. ticketId→token 매핑 필요. */
export function collectInvalidTokensFromReceipts(
  tokenByTicketId: Map<string, string>,
  receipts: Record<string, ExpoPushReceipt>,
): string[] {
  const invalid: string[] = [];
  for (const [id, receipt] of Object.entries(receipts)) {
    if (
      receipt.status === 'error' &&
      receipt.details?.error &&
      PRUNABLE_ERRORS.has(receipt.details.error)
    ) {
      const token = tokenByTicketId.get(id);
      if (token) invalid.push(token);
    }
  }
  return invalid;
}
