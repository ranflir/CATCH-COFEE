# 04. 내부 REST API 목록

> 기능명세서 → 엔드포인트 매핑. RESTful, `/api/v1` prefix, JSON. 인증: JWT(Bearer). 변경(POST/PATCH/DELETE)은 Idempotency-Key 권장. Soft delete.
> 상세 설계는 확정 후 `api-design`(NestJS) 스킬로 진행. 본 문서는 **범위 목록**.

## 공통 규약
- 응답 포맷: `{ "data": ..., "meta": ... }` / 에러: `{ "error": { "code", "message" } }`
- 페이지네이션: `?page=&limit=` 또는 cursor
- 권한: 🟢 User · 🟦 Seller · 🟥 Admin · ⚪ Public

## 1. 인증 / 사용자
| Method | Path | 권한 | 설명 |
|---|---|---|---|
| POST | `/auth/signup` | ⚪ | 회원가입 (bcrypt) |
| POST | `/auth/login` | ⚪ | 로그인 → access/refresh |
| POST | `/auth/refresh` | ⚪ | 토큰 갱신 |
| POST | `/auth/logout` | 🟢 | 로그아웃 |
| GET | `/me` | 🟢 | 내 프로필 |
| PATCH | `/me` | 🟢 | 프로필 수정 |

## 2. 카페 / 탐색 (기능 1)
| Method | Path | 권한 | 설명 |
|---|---|---|---|
| GET | `/cafes?lat=&lng=&radius=&sort=&q=` | ⚪ | 반경 검색(50m~5km), 정렬(거리/할인/즐겨찾기/알파벳), 키워드 |
| GET | `/cafes/map?bbox=` | ⚪ | 지도 영역 내 카페 마커 + 핵심 할인 |
| GET | `/cafes/:id` | ⚪ | 카페 상세(기본정보 + 거리) |
| GET | `/cafes/:id/discounts` | ⚪ | 출처별 할인(crawl/seller/report) |

## 3. 할인 (기능 1.3 / 7)
| Method | Path | 권한 | 설명 |
|---|---|---|---|
| GET | `/discounts/:id` | ⚪ | 할인 상세(정률·정액/기간/조건) |
| POST | `/cafes/:id/discounts` | 🟦 | 판매자 직접 할인 등록(검증: 0~100%, 종료>시작) |
| PATCH | `/discounts/:id` | 🟦🟥 | 수정 / 조기 종료(이력 로깅) |
| DELETE | `/discounts/:id` | 🟦🟥 | 종료/삭제(soft) |

## 4. 제보 (기능 6) ⭐
| Method | Path | 권한 | 설명 |
|---|---|---|---|
| POST | `/cafes/:id/reports` | 🟢 | 제보 등록(영수증 image 필수) |
| GET | `/reports/:id` | ⚪ | 제보 상세(확인 수 포함) |
| GET | `/me/reports?status=` | 🟢 | 내 제보 내역(상태 필터) |
| POST | `/reports/:id/confirm` | 🟢 | "이 정보 맞아요"(1인 1회) → 3인 도달 시 자동등록 |
| DELETE | `/reports/:id/confirm` | 🟢 | 확인 취소(자동등록 전까지만) |
| POST | `/uploads/receipt-presign` | 🟢 | 영수증 presigned PUT URL 발급 |

## 5. 결제수단 / 추천 (기능 3, 5)
| Method | Path | 권한 | 설명 |
|---|---|---|---|
| GET | `/me/payment-methods` | 🟢 | 보유 결제수단 목록 |
| POST | `/me/payment-methods` | 🟢 | 등록(암호화 저장) |
| PATCH | `/me/payment-methods/:id` | 🟢 | 기본 수단 설정 등 |
| DELETE | `/me/payment-methods/:id` | 🟢 | 삭제(soft) |
| GET | `/cafes/:id/recommendation` | 🟢 | 보유 수단 × 할인 → 최적 수단 + 예상 할인액/율 |
| POST | `/payments` | 🟢 | (V1.1) 결제 실행 — PG 호출 |
| GET | `/payments/:id` | 🟢 | (V1.1) 결제 상태/영수증 |

## 6. 즐겨찾기 / 알림 (기능 4)
| Method | Path | 권한 | 설명 |
|---|---|---|---|
| GET | `/me/favorites` | 🟢 | 즐겨찾기 목록 |
| POST | `/cafes/:id/favorite` | 🟢 | 즐겨찾기 추가 |
| DELETE | `/cafes/:id/favorite` | 🟢 | 제거 |
| GET | `/me/notification-settings` | 🟢 | 알림 설정 조회 |
| PATCH | `/me/notification-settings` | 🟢 | 카페/결제수단 알림 on/off |
| GET | `/me/notifications` | 🟢 | 알림 내역 |
| POST | `/me/devices` | 🟢 | 푸시 토큰 등록(FCM/Expo) |

## 7. 판매자 (기능 7)
| Method | Path | 권한 | 설명 |
|---|---|---|---|
| GET | `/seller/cafes` | 🟦 | 내 매장 목록 |
| GET | `/seller/cafes/:id/discounts` | 🟦 | 내 매장 할인 관리 |
| GET | `/seller/cafes/:id/reports` | 🟦 | 내 매장 제보 정보 관리 |
| PATCH/DELETE | `/seller/reports/:id` | 🟦 | 제보 기반 할인 수정/삭제(권한 검증·로깅) |

## 8. 관리자 (기능 2, 6.5)
| Method | Path | 권한 | 설명 |
|---|---|---|---|
| GET | `/admin/reports?status=대기` | 🟥 | 제보 검수 큐 |
| POST | `/admin/reports/:id/approve` | 🟥 | 승인 |
| POST | `/admin/reports/:id/reject` | 🟥 | 반려(사유) |
| GET | `/admin/crawl/sources` | 🟥 | 크롤링 대상 브랜드 관리 |
| POST | `/admin/crawl/run` | 🟥 | 수동 크롤링 트리거 |
| GET | `/admin/crawl/logs` | 🟥 | 실행 로그(건수/오류) |
| GET | `/admin/discounts` | 🟥 | 할인 데이터 관리 |

## 9. 내부(서버↔워커) — REST 아님
- 크롤링 워커 → 파싱 결과 적재 / 파싱 실패 → 검수 큐 insert
- 스케줄러(Cron, 일일) → 크롤링 잡 enqueue(BullMQ)
- 즐겨찾기/결제수단 신규 할인 감지 → 알림 잡 enqueue → FCM 발송
