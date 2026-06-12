import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, ne, sql } from 'drizzle-orm';
import { discounts, type Discount, type NewDiscount } from '@catch-coffee/db';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';

@Injectable()
export class DiscountsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findActiveByCafe(cafeId: string): Promise<Discount[]> {
    return this.db
      .select()
      .from(discounts)
      .where(
        and(
          eq(discounts.cafeId, cafeId),
          isNull(discounts.deletedAt),
          ne(discounts.status, 'ended'),
          ne(discounts.status, 'hidden'),
        ),
      )
      .orderBy(desc(discounts.infoUpdatedAt));
  }

  async findById(id: string): Promise<Discount | undefined> {
    const [row] = await this.db
      .select()
      .from(discounts)
      .where(and(eq(discounts.id, id), isNull(discounts.deletedAt)))
      .limit(1);
    return row;
  }

  async create(input: NewDiscount): Promise<Discount> {
    const [row] = await this.db.insert(discounts).values(input).returning();
    if (!row) {
      throw new Error('Failed to create discount');
    }
    return row;
  }

  async update(
    id: string,
    patch: Partial<
      Pick<
        NewDiscount,
        | 'title'
        | 'discountType'
        | 'discountValue'
        | 'targetScope'
        | 'conditions'
        | 'paymentType'
        | 'startAt'
        | 'endAt'
        | 'status'
      >
    >,
  ): Promise<Discount | undefined> {
    const [row] = await this.db
      .update(discounts)
      .set({
        ...patch,
        infoUpdatedAt: new Date(),
        updatedAt: new Date(),
        version: sql`${discounts.version} + 1`,
      })
      .where(and(eq(discounts.id, id), isNull(discounts.deletedAt)))
      .returning();
    return row;
  }

  async softDelete(id: string): Promise<Discount | undefined> {
    const [row] = await this.db
      .update(discounts)
      .set({ deletedAt: new Date(), status: 'ended', updatedAt: new Date() })
      .where(and(eq(discounts.id, id), isNull(discounts.deletedAt)))
      .returning();
    return row;
  }
}
