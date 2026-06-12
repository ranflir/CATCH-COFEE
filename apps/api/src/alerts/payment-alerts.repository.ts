import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { paymentAlerts, type PaymentAlert } from '@catch-coffee/db';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';

@Injectable()
export class PaymentAlertsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  listByUser(userId: string): Promise<PaymentAlert[]> {
    return this.db
      .select()
      .from(paymentAlerts)
      .where(eq(paymentAlerts.userId, userId))
      .orderBy(asc(paymentAlerts.paymentType));
  }

  async add(userId: string, paymentType: PaymentAlert['paymentType']): Promise<void> {
    await this.db
      .insert(paymentAlerts)
      .values({ userId, paymentType })
      .onConflictDoNothing();
  }

  async remove(
    userId: string,
    paymentType: PaymentAlert['paymentType'],
  ): Promise<PaymentAlert | undefined> {
    const [row] = await this.db
      .delete(paymentAlerts)
      .where(
        and(eq(paymentAlerts.userId, userId), eq(paymentAlerts.paymentType, paymentType)),
      )
      .returning();
    return row;
  }
}
