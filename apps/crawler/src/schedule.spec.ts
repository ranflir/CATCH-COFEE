import { resolveSchedule } from './schedule';

describe('resolveSchedule', () => {
  it('CRON_SCHEDULE 미설정 시 기본값(매시 정각)', () => {
    expect(resolveSchedule({} as NodeJS.ProcessEnv)).toBe('0 * * * *');
  });

  it('CRON_SCHEDULE 환경변수를 우선한다', () => {
    expect(resolveSchedule({ CRON_SCHEDULE: '*/5 * * * *' } as NodeJS.ProcessEnv)).toBe(
      '*/5 * * * *',
    );
  });

  it('공백만 있으면 기본값으로 폴백', () => {
    expect(resolveSchedule({ CRON_SCHEDULE: '  ' } as NodeJS.ProcessEnv)).toBe('0 * * * *');
  });
});
