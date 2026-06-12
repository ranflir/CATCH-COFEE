import { resolve } from 'path';
import { config } from 'dotenv';
import { log, logError } from './logger';
import { runCrawl } from './crawler/run-crawl';
import { dispatchNotifications } from './dispatcher/dispatch';
import { startSchedule } from './schedule';

// 모노레포 루트 .env 로드 (apps/crawler/dist/main.js 기준 3단계 상위)
config({ path: resolve(__dirname, '../../..', '.env') });

type Command = 'crawl' | 'dispatch' | 'all' | 'schedule';

/** @returns 'keep' 이면 상주(스케줄러), 'done' 이면 1회 실행 후 종료. */
async function main(): Promise<'keep' | 'done'> {
  const cmd = (process.argv[2] ?? 'all') as Command;
  log(`crawler start: cmd=${cmd}`);

  if (cmd === 'schedule') {
    startSchedule();
    return 'keep';
  }

  if (cmd === 'crawl' || cmd === 'all') {
    await runCrawl();
  }
  if (cmd === 'dispatch' || cmd === 'all') {
    await dispatchNotifications();
  }

  log('crawler done');
  return 'done';
}

main()
  .then((result) => {
    if (result === 'done') {
      process.exit(0);
    }
  })
  .catch((err) => {
    logError('crawler fatal', err);
    process.exit(1);
  });
