import { and, eq, isNull } from 'drizzle-orm';
import {
  getDb,
  crawlSources,
  crawlLogs,
  crawlCandidates,
} from '@catch-coffee/db';
import { log, logError } from '../logger';
import { parseDiscounts } from './parser';

async function fetchSource(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.text();
}

/**
 * 활성 크롤링 소스를 순회하며 원문 수집 → 파싱 → 검수 후보(crawl_candidates) 적재.
 * 각 소스 실행 결과는 crawl_logs 에 기록. 한 소스 실패가 전체를 막지 않는다.
 */
export async function runCrawl(): Promise<void> {
  const db = getDb();
  const sources = await db
    .select()
    .from(crawlSources)
    .where(and(eq(crawlSources.enabled, true), isNull(crawlSources.deletedAt)));

  log(`crawl: ${sources.length} active source(s)`);

  for (const source of sources) {
    const startedAt = new Date();
    try {
      const rawText = await fetchSource(source.url);
      const parsed = parseDiscounts(rawText, source.parseRule);

      if (parsed.length > 0) {
        await db.insert(crawlCandidates).values(
          parsed.map((p) => ({
            sourceId: source.id,
            rawText: p.rawSnippet,
            parsed: p,
            status: 'pending' as const,
          })),
        );
      }

      await db.insert(crawlLogs).values({
        sourceId: source.id,
        status: 'success',
        collectedCount: parsed.length,
        startedAt,
        finishedAt: new Date(),
      });
      log(`source ${source.id}: ${parsed.length} candidate(s)`);
    } catch (err) {
      await db.insert(crawlLogs).values({
        sourceId: source.id,
        status: 'failed',
        collectedCount: 0,
        error: err instanceof Error ? err.message : String(err),
        startedAt,
        finishedAt: new Date(),
      });
      logError(`source ${source.id} failed`, err);
    }
  }
}
