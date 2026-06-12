import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { paymentMethods, type PaymentMethod } from '@catch-coffee/db';
import { DRIZZLE, type DrizzleDB, type DrizzleTx } from '../database/database.module';

interface CreateInput {
  userId: string;
  type: PaymentMethod['type'];
  label: string;
  encryptedToken?: string;
  isDefault: boolean;
}

interface UpdatePatch {
  label?: string;
  encryptedToken?: string;
  isDefault?: boolean;
}

@Injectable()
export class PaymentMethodsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  listByUser(userId: string): Promise<PaymentMethod[]> {
    return this.db
      .select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.userId, userId), isNull(paymentMethods.deletedAt)))
      .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));
  }

  async findByIdForUser(id: string, userId: string): Promise<PaymentMethod | undefined> {
    const [row] = await this.db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, id),
          eq(paymentMethods.userId, userId),
          isNull(paymentMethods.deletedAt),
        ),
      )
      .limit(1);
    return row;
  }

  async create(input: CreateInput): Promise<PaymentMethod> {
    return this.db.transaction(async (tx) => {
      if (input.isDefault) {
        await this.clearDefault(tx, input.userId);
      }
      const [row] = await tx
        .insert(paymentMethods)
        .values({
          userId: input.userId,
          type: input.type,
          label: input.label,
          encryptedToken: input.encryptedToken,
          isDefault: input.isDefault,
        })
        .returning();
      if (!row) {
        throw new Error('Failed to create payment method');
      }
      return row;
    });
  }

  async update(
    id: string,
    userId: string,
    patch: UpdatePatch,
  ): Promise<PaymentMethod | undefined> {
    return this.db.transaction(async (tx) => {
      if (patch.isDefault === true) {
        await this.clearDefault(tx, userId);
      }
      const [row] = await tx
        .update(paymentMethods)
        .set({
          ...patch,
          updatedAt: new Date(),
          version: sql`${paymentMethods.version} + 1`,
        })
        .where(
          and(
            eq(paymentMethods.id, id),
            eq(paymentMethods.userId, userId),
            isNull(paymentMethods.deletedAt),
          ),
        )
        .returning();
      return row;
    });
  }

  async softDelete(id: string, userId: string): Promise<PaymentMethod | undefined> {
    const [row] = await this.db
      .update(paymentMethods)
      .set({ deletedAt: new Date(), isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(paymentMethods.id, id),
          eq(paymentMethods.userId, userId),
          isNull(paymentMethods.deletedAt),
        ),
      )
      .returning();
    return row;
  }

  private async clearDefault(tx: DrizzleTx, userId: string): Promise<void> {
    await tx
      .update(paymentMethods)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(paymentMethods.userId, userId),
          eq(paymentMethods.isDefault, true),
          isNull(paymentMethods.deletedAt),
        ),
      );
  }
}
