import {
  pgTable,
  text,
  varchar,
  boolean,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { ulid } from 'ulid';
import { brands } from './brands';
import { cafes } from './cafes';
import { crawlChannel, crawlRunStatus, crawlCandidateStatus } from './enums';

/** 크롤링 대상 채널 (기능 2.1.1) */
export const crawlSources = pgTable(
  'crawl_sources',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    brandId: text('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    channel: crawlChannel('channel').notNull(),
    url: text('url').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    /** 정보 추출 파싱 규칙 (기능 2.2.1) */
    parseRule: jsonb('parse_rule'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    brandIdx: index('crawl_sources_brand_idx').on(t.brandId),
  }),
);

/** 크롤링 실행 로그 (기능 2.3.2) */
export const crawlLogs = pgTable(
  'crawl_logs',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    sourceId: text('source_id').references(() => crawlSources.id, { onDelete: 'set null' }),
    status: crawlRunStatus('status').notNull(),
    collectedCount: integer('collected_count').notNull().default(0),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sourceIdx: index('crawl_logs_source_idx').on(t.sourceId),
    createdIdx: index('crawl_logs_created_idx').on(t.createdAt),
  }),
);

/** 파싱 결과 검수 큐 (기능 2.2.5) — 자동 등록 전 관리자 검수 */
export const crawlCandidates = pgTable(
  'crawl_candidates',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    sourceId: text('source_id').references(() => crawlSources.id, { onDelete: 'set null' }),
    cafeId: text('cafe_id').references(() => cafes.id, { onDelete: 'set null' }),
    rawText: text('raw_text'),
    /** 파싱된 할인 후보 (정규화 전) */
    parsed: jsonb('parsed'),
    status: crawlCandidateStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('crawl_candidates_status_idx').on(t.status, t.createdAt),
  }),
);

export type CrawlSource = InferSelectModel<typeof crawlSources>;
export type NewCrawlSource = InferInsertModel<typeof crawlSources>;
export type CrawlLog = InferSelectModel<typeof crawlLogs>;
export type NewCrawlLog = InferInsertModel<typeof crawlLogs>;
export type CrawlCandidate = InferSelectModel<typeof crawlCandidates>;
export type NewCrawlCandidate = InferInsertModel<typeof crawlCandidates>;
