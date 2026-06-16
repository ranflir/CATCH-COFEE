import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, getTableColumns, gte, ilike, isNull, lte, sql, type SQL } from 'drizzle-orm';
import { cafes, type Cafe } from '@catch-coffee/db';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';

export type CafeWithDistance = Cafe & { distanceM: number | null };

interface SearchParams {
  lat?: number;
  lng?: number;
  radius: number;
  sort: 'distance' | 'alphabetical';
  q?: string;
  page: number;
  limit: number;
}

function haversine(lat: number, lng: number): SQL<number> {
  // LEAST(1, ...)로 부동소수점 오차에 의한 acos 도메인 에러 방지.
  return sql<number>`(6371000 * acos(LEAST(1, cos(radians(${lat})) * cos(radians(${cafes.lat})) * cos(radians(${cafes.lng}) - radians(${lng})) + sin(radians(${lat})) * sin(radians(${cafes.lat})))))`;
}

@Injectable()
export class CafesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async search(params: SearchParams): Promise<CafeWithDistance[]> {
    const { lat, lng, radius, sort, q, page, limit } = params;
    const hasCoords = lat !== undefined && lng !== undefined;

    const conditions: SQL[] = [isNull(cafes.deletedAt)];
    if (q) {
      conditions.push(ilike(cafes.name, `%${q}%`));
    }
    if (hasCoords) {
      // bounding-box 1차 필터 (인덱스 활용) 후 하버사인 정밀 거리 계산.
      const latDelta = radius / 111_320;
      const lngDelta = radius / (111_320 * Math.cos((lat * Math.PI) / 180) || 1);
      conditions.push(gte(cafes.lat, lat - latDelta));
      conditions.push(lte(cafes.lat, lat + latDelta));
      conditions.push(gte(cafes.lng, lng - lngDelta));
      conditions.push(lte(cafes.lng, lng + lngDelta));
    }

    const distanceExpr = hasCoords ? haversine(lat, lng) : sql<number | null>`NULL`;

    const base = this.db
      .select({ ...getTableColumns(cafes), distanceM: distanceExpr })
      .from(cafes)
      .where(and(...conditions))
      .$dynamic();

    const ordered =
      hasCoords && sort === 'distance'
        ? base.orderBy(distanceExpr)
        : base.orderBy(asc(cafes.name));

    const rows = await ordered.limit(limit).offset((page - 1) * limit);

    // 반경 밖(코너) 제거: bbox는 사각형이라 radius보다 멀 수 있음.
    return hasCoords
      ? rows.filter((r) => r.distanceM === null || r.distanceM <= radius)
      : rows;
  }

  async findById(id: string, lat?: number, lng?: number): Promise<CafeWithDistance | undefined> {
    const hasCoords = lat !== undefined && lng !== undefined;
    const distanceExpr = hasCoords ? haversine(lat, lng) : sql<number | null>`NULL`;
    const [row] = await this.db
      .select({ ...getTableColumns(cafes), distanceM: distanceExpr })
      .from(cafes)
      .where(and(eq(cafes.id, id), isNull(cafes.deletedAt)))
      .limit(1);
    return row;
  }

  async findByOwnerId(ownerId: string): Promise<Cafe[]> {
    return this.db
      .select()
      .from(cafes)
      .where(and(eq(cafes.ownerId, ownerId), isNull(cafes.deletedAt)))
      .orderBy(asc(cafes.name));
  }

  async findAllActive(): Promise<Cafe[]> {
    return this.db
      .select()
      .from(cafes)
      .where(isNull(cafes.deletedAt))
      .orderBy(asc(cafes.name));
  }

  async findInBbox(box: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
    limit: number;
  }): Promise<Cafe[]> {
    return this.db
      .select()
      .from(cafes)
      .where(
        and(
          isNull(cafes.deletedAt),
          gte(cafes.lat, box.minLat),
          lte(cafes.lat, box.maxLat),
          gte(cafes.lng, box.minLng),
          lte(cafes.lng, box.maxLng),
        ),
      )
      .limit(box.limit);
  }
}
