import { Injectable, NotFoundException } from '@nestjs/common';
import type { Cafe, Discount } from '@catch-coffee/db';
import { CafesRepository } from './cafes.repository';
import { DiscountsRepository } from '../discounts/discounts.repository';
import type { CafeSearchDto } from './dto/cafe-search.dto';
import type { CafeMapDto } from './dto/cafe-map.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class CafesService {
  constructor(
    private readonly cafesRepository: CafesRepository,
    private readonly discountsRepository: DiscountsRepository,
  ) {}

  async search(dto: CafeSearchDto) {
    const items = await this.cafesRepository.search(dto);
    return {
      items,
      meta: { page: dto.page, limit: dto.limit, count: items.length },
    };
  }

  async getCafe(id: string, lat?: number, lng?: number) {
    const cafe = await this.cafesRepository.findById(id, lat, lng);
    if (!cafe) {
      throw new NotFoundException({ code: ErrorCode.CAFE_NOT_FOUND });
    }
    return cafe;
  }

  async getCafeDiscounts(id: string) {
    const cafe = await this.cafesRepository.findById(id);
    if (!cafe) {
      throw new NotFoundException({ code: ErrorCode.CAFE_NOT_FOUND });
    }
    const all = await this.discountsRepository.findActiveByCafe(id);
    const grouped: Record<Discount['source'], Discount[]> = {
      crawl: [],
      seller: [],
      report: [],
    };
    for (const d of all) {
      grouped[d.source].push(d);
    }
    return { cafeId: id, discounts: grouped };
  }

  async listMyCafes(user: JwtPayload): Promise<Cafe[]> {
    if (user.role === 'admin') {
      return this.cafesRepository.findAllActive();
    }
    return this.cafesRepository.findByOwnerId(user.id);
  }

  async getMapMarkers(dto: CafeMapDto) {
    const cafes = await this.cafesRepository.findInBbox({ ...dto.bbox, limit: dto.limit });
    return {
      markers: cafes.map((c) => ({
        id: c.id,
        name: c.name,
        brandId: c.brandId,
        lat: c.lat,
        lng: c.lng,
      })),
    };
  }
}
