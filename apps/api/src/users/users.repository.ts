import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { users, type User } from '@catch-coffee/db';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findActiveById(id: string): Promise<User | undefined> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return row;
  }

  async updateProfile(
    id: string,
    patch: { name?: string; phone?: string | null },
  ): Promise<User | undefined> {
    const [row] = await this.db
      .update(users)
      .set({
        ...patch,
        updatedAt: new Date(),
        version: sql`${users.version} + 1`,
      })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();
    return row;
  }
}
