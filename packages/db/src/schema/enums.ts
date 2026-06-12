import { pgEnum } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['user', 'seller', 'admin']);

/** 할인 정보 출처 — 화면 섹션 구분의 기준 */
export const discountSource = pgEnum('discount_source', ['crawl', 'seller', 'report']);

export const discountType = pgEnum('discount_type', ['percentage', 'amount']);

export const discountStatus = pgEnum('discount_status', [
  'scheduled', // 시작일 이전
  'active', // 진행 중
  'ended', // 기간 종료/조기 종료
  'hidden', // 신고/검수로 숨김
]);

/** 할인 적용 대상 범위 */
export const discountTargetScope = pgEnum('discount_target_scope', ['all', 'menu']);

export const reportStatus = pgEnum('report_status', [
  'pending', // 등록 직후 대기
  'reviewing', // 관리자 검수 중
  'approved', // 관리자 승인
  'rejected', // 반려
  'auto_registered', // 3인 확인 자동 등록
]);

/** 제보 정보 출처(사용자가 선택) */
export const reportInfoSource = pgEnum('report_info_source', [
  'offline', // 오프라인 매장 안내
  'receipt', // 영수증
  'store_notice', // 매장 게시 안내
  'witnessed', // 직접 목격
]);

export const paymentType = pgEnum('payment_type', [
  'naverpay',
  'kakaopay',
  'card',
  'other',
]);

export const crawlChannel = pgEnum('crawl_channel', ['website', 'app_api', 'sns']);

export const crawlRunStatus = pgEnum('crawl_run_status', ['success', 'failed', 'partial']);

export const crawlCandidateStatus = pgEnum('crawl_candidate_status', [
  'pending',
  'approved',
  'rejected',
]);

export const devicePlatform = pgEnum('device_platform', ['ios', 'android', 'web']);

export const notificationType = pgEnum('notification_type', [
  'cafe_discount', // 즐겨찾기 카페 신규 할인
  'payment_discount', // 결제수단 기반 할인
  'report_status', // 제보 상태 변경/자동 등록
]);
