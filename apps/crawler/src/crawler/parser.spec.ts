import { parseDiscounts } from './parser';

describe('parseDiscounts', () => {
  it('기본 규칙으로 정률 할인을 추출한다', () => {
    const text = '오늘의 메뉴\n아메리카노 20% 할인\n영업시간 09-22';
    const result = parseDiscounts(text, null);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ discountType: 'percentage', discountValue: 20 });
  });

  it('정액 할인을 추출한다', () => {
    const result = parseDiscounts('전 메뉴 1,500원 할인 행사', null);
    expect(result[0]).toMatchObject({ discountType: 'amount', discountValue: 1500 });
  });

  it('정률을 정액보다 우선한다(한 줄에 둘 다 있을 때)', () => {
    const result = parseDiscounts('10% 할인 + 500원 추가 세일', null);
    expect(result[0]?.discountType).toBe('percentage');
    expect(result[0]?.discountValue).toBe(10);
  });

  it('키워드 없는 줄은 무시한다', () => {
    const result = parseDiscounts('그냥 공지사항입니다', null);
    expect(result).toHaveLength(0);
  });

  it('100% 초과 정률은 무시한다', () => {
    const result = parseDiscounts('할인 150% 라고 적힌 오타', null);
    // 정률 무효 → 정액도 없음
    expect(result.every((r) => r.discountType !== 'percentage')).toBe(true);
  });

  it('커스텀 parseRule(keywords/percentPattern)을 적용한다', () => {
    const rule = { keywords: ['EVENT'], percentPattern: 'SAVE (\\d+)' };
    const result = parseDiscounts('EVENT SAVE 30 today\n무관한 줄', rule);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ discountType: 'percentage', discountValue: 30 });
  });

  it('잘못된 정규식은 던지지 않고 빈 결과로 방어한다', () => {
    const rule = { percentPattern: '(' };
    expect(() => parseDiscounts('20% 할인', rule)).not.toThrow();
  });
});
