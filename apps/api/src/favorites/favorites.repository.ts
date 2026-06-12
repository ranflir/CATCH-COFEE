import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { cafes, favorites, type Cafe, type Favorite } from '@catch-coffee/db';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';

export interface FavoriteWithCafe {
  cafe: Cafe;
  notifyEnabled: boolean;
  createdAt: Date;
}

@Injectable()
export class FavoritesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listByUser(userId: string): Promise<FavoriteWithCafe[]> {
    const rows = await this.db
      .select({ cafe: cafes, notifyEnabled: favorites.notifyEnabled, createdAt: favorites.createdAt })
      .from(favorites)
      .innerJoin(cafes, eq(favorites.cafeId, cafes.id))
      .where(and(eq(favorites.userId, userId), isNull(cafes.deletedAt)))
      .orderBy(desc(favorites.createdAt));
    return rows;
  }

  async add(userId: string, cafeId: string, notifyEnabled: boolean): Promise<void> {
    await this.db
      .insert(favorites)
      .values({ userId, cafeId, notifyEnabled })
      .onConflictDoNothing();
  }

  async remove(userId: string, cafeId: string): Promise<Favorite | undefined> {
    const [row] = await this.db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.cafeId, cafeId)))
      .returning();
    return row;
  }

  async updateNotify(
    userId: string,
    cafeId: string,
    notifyEnabled: boolean,
  ): Promise<Favorite | undefined> {
    const [row] = await this.db
      .update(favorites)
      .set({ notifyEnabled })
      .where(and(eq(favorites.userId, userId), eq(favorites.cafeId, cafeId)))
      .returning();
    return row;
  }
}
