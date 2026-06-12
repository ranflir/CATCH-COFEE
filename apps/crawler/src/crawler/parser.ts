/** 파싱된 할인 후보 (정규화 전) — crawl_candidates.parsed 에 저장. */
export interface ParsedDiscount {
  title: string;
  rawSnippet: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
}

/** crawl_sources.parseRule(jsonb) 스키마 */
export interface ParseRule {
  /** 이 키워드가 포함된 줄만 후보로 본다(미설정 시 기본 키워드). */
  keywords?: string[];
  /** 정률(%) 추출 정규식 — 첫 캡처 그룹이 숫자. */
  percentPattern?: string;
  /** 정액(원) 추출 정규식 — 첫 캡처 그룹이 숫자(콤마 허용). */
  amountPattern?: string;
}

const DEFAULT_KEYWORDS = ['할인', '세일', 'sale', '%', '원'];
const DEFAULT_PERCENT = '(\\d{1,3})\\s*%';
const DEFAULT_AMOUNT = '([\\d,]{2,})\\s*원';
const TITLE_MAX = 200;

function safeRegExp(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, 'i');
  } catch {
    return null;
  }
}

function toNumber(raw: string): number {
  return Number(raw.replace(/,/g, ''));
}

/**
 * parseRule 기반으로 원문에서 할인 후보를 추출.
 * 라인 단위로 키워드 필터 → 정률/정액 추출. 정률 우선.
 */
export function parseDiscounts(rawText: string, parseRule: unknown): ParsedDiscount[] {
  const rule: ParseRule = isParseRule(parseRule) ? parseRule : {};
  const keywords = rule.keywords?.length ? rule.keywords : DEFAULT_KEYWORDS;
  const percentRe = safeRegExp(rule.percentPattern ?? DEFAULT_PERCENT);
  const amountRe = safeRegExp(rule.amountPattern ?? DEFAULT_AMOUNT);

  const results: ParsedDiscount[] = [];

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (!keywords.some((k) => line.toLowerCase().includes(k.toLowerCase()))) {
      continue;
    }

    const percentMatch = percentRe?.exec(line);
    if (percentMatch?.[1]) {
      const value = toNumber(percentMatch[1]);
      if (value > 0 && value <= 100) {
        results.push({
          title: line.slice(0, TITLE_MAX),
          rawSnippet: line,
          discountType: 'percentage',
          discountValue: value,
        });
        continue;
      }
    }

    const amountMatch = amountRe?.exec(line);
    if (amountMatch?.[1]) {
      const value = toNumber(amountMatch[1]);
      if (value > 0) {
        results.push({
          title: line.slice(0, TITLE_MAX),
          rawSnippet: line,
          discountType: 'amount',
          discountValue: value,
        });
      }
    }
  }

  return results;
}

function isParseRule(value: unknown): value is ParseRule {
  return typeof value === 'object' && value !== null;
}
