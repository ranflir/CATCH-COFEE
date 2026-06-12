import cron from 'node-cron';
import { log, logError } from './logger';
import { runCrawl } from './crawler/run-crawl';
import { dispatchNotifications } from './dispatcher/dispatch';

const DEFAULT_SCHEDULE = '0 * * * *'; // 매시 정각

/** CRON_SCHEDULE 환경변수 또는 기본값. */
export function resolveSchedule(env: NodeJS.ProcessEnv = process.env): string {
  return env.CRON_SCHEDULE?.trim() || DEFAULT_SCHEDULE;
}

/** 한 사이클: 수집 → 알림 디스패치. 실패는 흡수해 스케줄러를 죽이지 않는다. */
export async function runCycle(): Promise<void> {
  try {
    await runCrawl();
    await dispatchNotifications();
  } catch (err) {
    logError('crawler cycle failed', err);
  }
}

/** node-cron 스케줄러 시작(상주 프로세스). */
export function startSchedule(): void {
  const expr = resolveSchedule();
  if (!cron.validate(expr)) {
    throw new Error(`Invalid CRON_SCHEDULE: ${expr}`);
  }
  log(`scheduler started: ${expr}`);
  cron.schedule(expr, () => {
    void runCycle();
  });
}
