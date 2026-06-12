import { Injectable, NotFoundException } from '@nestjs/common';
import { FavoritesRepository, type FavoriteWithCafe } from './favorites.repository';
import { CafesRepository } from '../cafes/cafes.repository';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly repository: FavoritesRepository,
    private readonly cafesRepository: CafesRepository,
  ) {}

  list(userId: string): Promise<FavoriteWithCafe[]> {
    return this.repository.listByUser(userId);
  }

  async add(userId: string, cafeId: string, notifyEnabled: boolean): Promise<void> {
    const cafe = await this.cafesRepository.findById(cafeId);
    if (!cafe) {
      throw new NotFoundException({ code: ErrorCode.CAFE_NOT_FOUND });
    }
    await this.repository.add(userId, cafeId, notifyEnabled);
  }

  async remove(userId: string, cafeId: string): Promise<void> {
    const removed = await this.repository.remove(userId, cafeId);
    if (!removed) {
      throw new NotFoundException({ code: ErrorCode.FAVORITE_NOT_FOUND });
    }
  }

  async updateNotify(
    userId: string,
    cafeId: string,
    notifyEnabled: boolean,
  ): Promise<{ cafeId: string; notifyEnabled: boolean }> {
    const updated = await this.repository.updateNotify(userId, cafeId, notifyEnabled);
    if (!updated) {
      throw new NotFoundException({ code: ErrorCode.FAVORITE_NOT_FOUND });
    }
    return { cafeId, notifyEnabled: updated.notifyEnabled };
  }
}
