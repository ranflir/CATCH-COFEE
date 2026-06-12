import {
  pgTable,
  text,
  varchar,
  doublePrecision,
  jsonb,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { ulid } from 'ulid';
import { brands } from './brands';
import { users } from './users';

export const cafes = pgTable(
  'cafes',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    /** 프랜차이즈면 brand 연결, 개인 카페면 null */
    brandId: text('brand_id').references(() => brands.id, { onDelete: 'set null' }),
    /** 해당 매장 판매자(Seller). 단일 소유 1:N. 다중 관리자는 향후 N:M 확장 */
    ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 200 }).notNull(),
    address: varchar('address', { length: 500 }),
    roadAddress: varchar('road_address', { length: 500 }),
    phone: varchar('phone', { length: 20 }),
    /** 반경 검색용 위경도 (lat/lng + 하버사인 계산) */
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    /** 카카오 장소 ID — 외부 데이터 매핑/중복 방지 */
    kakaoPlaceId: varchar('kakao_place_id', { length: 50 }),
    businessHours: jsonb('business_hours'),
    metadata: jsonb('metadata'),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    // 반경 검색: lat/lng bounding-box 1차 필터용 복합 인덱스
    geoIdx: index('cafes_geo_idx').on(t.lat, t.lng),
    brandIdx: index('cafes_brand_idx').on(t.brandId),
    ownerIdx: index('cafes_owner_idx').on(t.ownerId),
    kakaoUniq: uniqueIndex('cafes_kakao_place_uniq')
      .on(t.kakaoPlaceId)
      .where(sql`${t.kakaoPlaceId} is not null and ${t.deletedAt} is null`),
  }),
);

export type Cafe = InferSelectModel<typeof cafes>;
export type NewCafe = InferInsertModel<typeof cafes>;
