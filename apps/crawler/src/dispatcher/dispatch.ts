import { and, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import {
  getDb,
  discounts,
  favorites,
  paymentAlerts,
  notifications,
  userDevices,
  type Discount,
  type Notification,
} from '@catch-coffee/db';
import { log } from '../logger';
import {
  buildExpoMessages,
  collectInvalidTokensFromReceipts,
  collectInvalidTokensFromTickets,
  getExpoReceipts,
  sendExpoPush,
} from './push';

type NotifyType = Extract<Notification['type'], 'cafe_discount' | 'payment_discount'>;

/**
 * 최근 생성된 할인에 대해 대상 사용자에게 알림(inbox) 생성.
 * - 즐겨찾기(notifyEnabled) 카페의 신규 할인 → cafe_discount
 * - 구독한 결제수단(payment_alerts)과 매칭되는 할인 → payment_discount
 *
 * 중복 발송은 notifications.data->>'discountId' 로 멱등 처리.
 * 실제 푸시 전송(FCM/Expo, user_devices)은 MVP 스텁(로그)로 대체.
 */
export async function dispatchNotifications(sinceMinutes = 60): Promise<void> {
  const db = getDb();
  const since = new Date(Date.now() - sinceMinutes * 60_000);

  const recent = await db
    .select()
    .from(discounts)
    .where(and(gte(discounts.createdAt, since), isNull(discounts.deletedAt)));

  log(`dispatch: ${recent.length} discount(s) since ${since.toISOString()}`);

  let created = 0;
  for (const discount of recent) {
    const targets = await resolveTargets(db, discount);
    for (const [userId, type] of targets) {
      if (await notifyOnce(db, userId, type, discount)) {
        created += 1;
      }
    }
  }
  log(`dispatch: ${created} notification(s) created`);
}

async function resolveTargets(
  db: ReturnType<typeof getDb>,
  discount: Discount,
): Promise<Map<string, NotifyType>> {
  const targets = new Map<string, NotifyType>();

  const favUsers = await db
    .select({ userId: favorites.userId })
    .from(favorites)
    .where(and(eq(favorites.cafeId, discount.cafeId), eq(favorites.notifyEnabled, true)));
  for (const f of favUsers) {
    targets.set(f.userId, 'cafe_discount');
  }

  if (discount.paymentType) {
    const alertUsers = await db
      .select({ userId: paymentAlerts.userId })
      .from(paymentAlerts)
      .where(eq(paymentAlerts.paymentType, discount.paymentType));
    for (const a of alertUsers) {
      // 즐겨찾기 알림이 이미 잡혔으면 중복 생성하지 않음
      if (!targets.has(a.userId)) {
        targets.set(a.userId, 'payment_discount');
      }
    }
  }

  return targets;
}

async function notifyOnce(
  db: ReturnType<typeof getDb>,
  userId: string,
  type: NotifyType,
  discount: Discount,
): Promise<boolean> {
  const existing = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, type),
        sql`${notifications.data}->>'discountId' = ${discount.id}`,
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return false;
  }

  await db.insert(notifications).values({
    userId,
    type,
    title: '새로운 할인 정보',
    body: discount.title,
    data: { discountId: discount.id, cafeId: discount.cafeId },
  });

  await pushToDevices(db, userId, type, discount);
  log(`notify ${userId} (${type}) discount=${discount.id}`);
  return true;
}

async function pushToDevices(
  db: ReturnType<typeof getDb>,
  userId: string,
  type: NotifyType,
  discount: Discount,
): Promise<void> {
  const devices = await db
    .select({ token: userDevices.expoPushToken })
    .from(userDevices)
    .where(and(eq(userDevices.userId, userId), isNull(userDevices.deletedAt)));

  const messages = buildExpoMessages(
    devices.map((d) => d.token),
    {
      title: '새로운 할인 정보',
      body: discount.title,
      data: { discountId: discount.id, cafeId: discount.cafeId, type },
    },
  );
  if (messages.length === 0) {
    return;
  }

  const tickets = await sendExpoPush(messages);

  // 1) send 단계에서 즉시 판별되는 무효 토큰
  const invalid = new Set(collectInvalidTokensFromTickets(messages, tickets));

  // 2) 정상 접수된 ticket 의 receipt 로 추가 판별 (best-effort)
  const tokenByTicketId = new Map<string, string>();
  tickets.forEach((ticket, i) => {
    if (ticket.status === 'ok' && ticket.id) {
      const token = messages[i]?.to;
      if (token) tokenByTicketId.set(ticket.id, token);
    }
  });
  if (tokenByTicketId.size > 0) {
    const receipts = await getExpoReceipts([...tokenByTicketId.keys()]);
    for (const token of collectInvalidTokensFromReceipts(tokenByTicketId, receipts)) {
      invalid.add(token);
    }
  }

  await pruneDeadTokens(db, [...invalid]);
}

/** 무효 토큰을 soft-delete 해 다음 발송 대상에서 제외. */
async function pruneDeadTokens(
  db: ReturnType<typeof getDb>,
  tokens: string[],
): Promise<void> {
  if (tokens.length === 0) {
    return;
  }
  await db
    .update(userDevices)
    .set({ deletedAt: new Date() })
    .where(and(inArray(userDevices.expoPushToken, tokens), isNull(userDevices.deletedAt)));
  log(`dispatch: pruned ${tokens.length} dead device token(s)`);
}
