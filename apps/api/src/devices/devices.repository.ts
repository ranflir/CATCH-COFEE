import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { userDevices, type UserDevice } from '@catch-coffee/db';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';

@Injectable()
export class DevicesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  listByUser(userId: string): Promise<UserDevice[]> {
    return this.db
      .select()
      .from(userDevices)
      .where(and(eq(userDevices.userId, userId), isNull(userDevices.deletedAt)))
      .orderBy(desc(userDevices.updatedAt));
  }

  async findActiveByToken(token: string): Promise<UserDevice | undefined> {
    const [row] = await this.db
      .select()
      .from(userDevices)
      .where(and(eq(userDevices.expoPushToken, token), isNull(userDevices.deletedAt)))
      .limit(1);
    return row;
  }

  async insert(input: {
    userId: string;
    expoPushToken: string;
    platform: 'ios' | 'android' | 'web';
  }): Promise<UserDevice> {
    const [row] = await this.db.insert(userDevices).values(input).returning();
    return row!;
  }

  async reassign(
    id: string,
    input: { userId: string; platform: 'ios' | 'android' | 'web' },
  ): Promise<UserDevice> {
    const [row] = await this.db
      .update(userDevices)
      .set({ userId: input.userId, platform: input.platform, updatedAt: new Date() })
      .where(eq(userDevices.id, id))
      .returning();
    return row!;
  }

  async softDelete(id: string, userId: string): Promise<UserDevice | undefined> {
    const [row] = await this.db
      .update(userDevices)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(userDevices.id, id),
          eq(userDevices.userId, userId),
          isNull(userDevices.deletedAt),
        ),
      )
      .returning();
    return row;
  }
}
