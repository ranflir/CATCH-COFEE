import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { users, type User } from '@catch-coffee/db';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findActiveByEmail(email: string): Promise<User | undefined> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);
    return row;
  }

  async findActiveById(id: string): Promise<User | undefined> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return row;
  }

  async createUser(input: {
    email: string;
    passwordHash: string;
    name: string;
    phone?: string;
  }): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        phone: input.phone,
      })
      .returning();
    if (!row) {
      throw new Error('Failed to create user');
    }
    return row;
  }
}
