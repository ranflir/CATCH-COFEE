/** 파싱된 할인 후보 (정규화 전) — crawl_candidates.parsed 에 저장. */
export interface ParsedDiscount {
  title: string;
  rawSnippet: string;
}

/**
 * parseRule(jsonb) 기반으로 원문에서 할인 후보를 추출.
 *
 * MVP 스텁: 실제 셀렉터/정규식 파싱은 미구현. parseRule 스키마 확정 후
 * 채널별(website/app_api/sns) 파서를 구현한다. 현재는 빈 배열 반환.
 */
export function parseDiscounts(_rawText: string, _parseRule: unknown): ParsedDiscount[] {
  // TODO: parseRule 스키마 기반 추출 구현 (cheerio/정규식 등)
  return [];
}
