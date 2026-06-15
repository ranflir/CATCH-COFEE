import { z } from 'zod';

/**
 * ISO 8601 문자열 ↔ Date 코덱.
 *
 * `z.coerce.date()` 는 출력 타입이 Date 라 `z.toJSONSchema`(OpenAPI 생성) 에서
 * "Date cannot be represented in JSON Schema" 로 throw 된다.
 * 코덱을 쓰면 입력 스키마는 string(date-time)으로 문서화되고,
 * 런타임 parse 는 그대로 Date 를 산출한다.
 */
export const isoDate = z.codec(z.iso.datetime({ offset: true }), z.date(), {
  decode: (isoString) => new Date(isoString),
  encode: (date) => date.toISOString(),
});
