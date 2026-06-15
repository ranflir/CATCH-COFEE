# ☕ Catch Coffee (CATCH-COFFEE)

> **내 주변 카페 할인, 가장 빠르게 찾고 가장 똑똑하게 결제하다.**
>
> 위치 기반 실시간 카페 할인정보 공유 + 최적 결제수단 추천 플랫폼

---

## 📌 한 줄 정의

저렴한 커피 할인 정보 제공 서비스 — 사용자의 현재 위치를 기반으로 주변 저가 카페의 실시간 할인·페이백 정보를 모아 요약해주고, 결제 시점에 가장 유리한 결제수단을 추천한다.

## 🎯 해결하려는 문제

통신사 할인, 카드사 청구할인, 멤버십 적립, 시즌 프로모션, 간편결제 페이백… 카페 할인 정보는 매장 배너 · SNS · 각 앱 공지 등 **비정형 채널에 흩어져 있어** 소비자가 실시간으로 비교하기 어렵다. 그 결과:

- 소비자는 **가장 유리한 결제수단을 놓쳐** 불필요한 지출이 발생한다.
- 소규모 개인 카페의 즉흥적 프로모션은 **온라인에 노출되지 않는다.**
- 카페 운영자는 진행 중인 프로모션의 **홍보 효과를 누리지 못한다.**

## 💡 핵심 컨셉 — 3중 데이터 검증

Catch Coffee의 차별점은 **사용자 제보 + 관리자 검수 + 자동 크롤링**으로 이어지는 3중 데이터 검증 구조로 정보의 *신선도*와 *정확도*를 동시에 확보하고, 특정 카드사·플랫폼에 종속되지 않는 **전(全) 결제수단 비교·추천**을 제공한다는 점이다.

```
[자동 크롤링] ─┐
[판매자 등록] ─┼─▶ 할인 정보 DB ─▶ 위치/결제수단 기반 추천 ─▶ 사용자
[사용자 제보] ─┘        ▲
                   [관리자 검수 / 3인 확인 자동등록]
```

## 👥 사용자 역할

| 역할 | 설명 |
|---|---|
| **User** | 할인 탐색, 제보 등록, "이 정보 맞아요" 확인, 결제수단 등록, 알림 설정 |
| **Seller** | 자사 카페 할인 직접 등록/수정/종료, 자사 제보 정보 관리 |
| **Admin** | 제보 검수(승인/반려), 크롤링 관리, 할인 데이터 관리 |

## ✨ 주요 기능 (기능명세서 기준)

1. **주변 카페 할인 정보 실시간 제공** — 위치 기반 반경 검색(50m~5km), 지도/목록, 카페 상세 할인 정보 (중요도: 높음)
2. **자동 이벤트 정보 수집·요약** — 주요 브랜드(메가커피·컴포즈·빽다방 등) 공식 채널 크롤링 → 파싱 → DB 저장 → 일일 스케줄 (중요도: 높음)
3. **최적 결제 방법 추천** — 보유 결제수단 × 카페 할인 매칭 → 최대 할인/페이백 결제수단 추천 (중요도: 높음)
4. **사용자 맞춤형 알림** — 즐겨찾기 카페 / 특정 결제수단 신규 할인 시 푸시 알림 (중요도: 중간)
5. **간편 결제 연동** — 결제수단 등록 → 최종 금액 확인 → 결제 실행 → 성공/실패 안내 (중요도: 낮음 / V1.1+)
6. **사용자 제보로 할인 정보 보완** — 영수증·사진 첨부 제보, "이 정보 맞아요" 1인 1회 확인(취소 가능), **3인 확인 시 자동 등록**, 사용자 제보 배지 표기 (중요도: 높음)
7. **판매자 직접 할인 등록** — 할인명/정률·정액/적용 대상/기간/조건 입력, 수정·조기 종료 (중요도: 높음)

> 전체 상세 기능명세는 [`docs/01-기획-요약.md`](docs/01-기획-요약.md) 참고.

## 🗺️ 유저 플로우 (요약)

`홈/지도 탐색` → `카페 상세 / 할인 상세` → `결제 추천·진행` · `제보 등록` · `즐겨찾기` → `마이페이지(제보 내역·결제수단·알림)` / `판매자 대시보드` / `관리자 검수·크롤링`

전체 플로우는 [`docs/유저플로우.md`](docs/유저플로우.md)(Mermaid) 참고.

## 🧱 기술 스택 (제안 — 확정 전)

WARA 모노레포와 동일한 컨벤션을 따른다. **본 스택은 검토용 제안이며 확정 시 업데이트한다.** 상세 비교는 [`docs/02-기술스택-설계.md`](docs/02-기술스택-설계.md) 참고.

| 영역 | 선택(제안) |
|---|---|
| 모노레포 | pnpm + Turborepo |
| 백엔드 API | NestJS + TypeScript |
| DB / ORM | PostgreSQL + Drizzle ORM |
| 웹 (사용자/판매자/관리자) | Next.js |
| 모바일 | Expo (React Native) |
| 크롤링 워커 | Node + Playwright/Cheerio, 스케줄러 |
| 캐시/큐 | Redis |
| 지도/장소 | Kakao Map + Local API |
| 푸시 | Firebase Cloud Messaging (Expo Notifications) |
| 이미지 저장 | S3 호환 오브젝트 스토리지 (R2 등) |

## 📂 (예정) 프로젝트 구조

```
catch-coffee/
├─ apps/
│  ├─ api/        # NestJS API 서버
│  ├─ web/        # Next.js (사용자/판매자/관리자)
│  ├─ mobile/     # Expo (iOS/Android)
│  └─ crawler/    # 크롤링 + 파싱 워커
├─ packages/
│  ├─ types/      # 공유 타입 (DTO/스키마)
│  ├─ ui/         # 공유 UI
│  ├─ tsconfig/
│  └─ eslint-config/
└─ docs/
```

## 📑 문서

| 문서 | 내용 |
|---|---|
| [`docs/01-기획-요약.md`](docs/01-기획-요약.md) | 기획서 + 기능명세서 요약 |
| [`docs/02-기술스택-설계.md`](docs/02-기술스택-설계.md) | 기술 스택/구조 설계 (옵션 비교) |
| [`docs/03-karpathy-분석.md`](docs/03-karpathy-분석.md) | 기획 가정·리스크·단순화 분석 |
| [`docs/04-내부-API-목록.md`](docs/04-내부-API-목록.md) | 서비스 내부 REST API 목록 |
| [`docs/05-외부연동-가이드.md`](docs/05-외부연동-가이드.md) | 외부 API 탐색 + 연동 방법 |

## 🌐 배포 (Railway)

- API: `https://catch-coffeecrawler-production.up.railway.app` (`GET /api/v1/health`)
- **API 문서(Swagger UI)**: `/docs` · OpenAPI JSON: `/docs-json` (Zod 스키마 기반 자동 생성)
- main 푸시 시 GitHub 연동으로 자동 배포 (`railway.json` 빌드/실행 설정, branch=main)

## ⚙️ 운영 환경변수 & 시크릿

전체 키 목록은 [`.env.example`](.env.example) 참고. 핵심 통합별 필요 값:

| 통합 | 필요 env | 미설정 시 동작 |
|---|---|---|
| **S3 영수증 업로드** (`apps/api` UploadsService) | `AWS_REGION`, `S3_BUCKET`, (+ AWS 자격증명: 로컬은 `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`, 배포는 IAM Role 권장), 선택 `S3_PUBLIC_BASE_URL` | presign 요청 시 `getOrThrow` 로 에러 |
| **Redis 멱등성** (`Idempotency-Key`) | `REDIS_URL` | 인터셉터 no-op 통과 (멱등성 미적용) |
| **Expo 푸시** (`apps/crawler` 디스패처) | `EXPO_ACCESS_TOKEN` (선택) | 인증 헤더 없이 전송 시도, `DeviceNotRegistered` 토큰은 자동 soft-delete |

### GitHub Actions 설정 (크롤러 워크플로)

[`.github/workflows/crawler.yml`](.github/workflows/crawler.yml) 는 매시 정각 + 수동 트리거로 수집/알림을 실행한다. 다음을 리포지토리에 등록한다:

- **Variables** (Settings → Secrets and variables → Actions → Variables)
  - `CRAWLER_ENABLED` = `true` (이 값이 `true` 일 때만 잡 실행)
- **Secrets** (동일 화면 → Secrets)
  - `DATABASE_URL` — 운영 DB 접속 문자열
  - `EXPO_ACCESS_TOKEN` — Expo 푸시 토큰 (선택, 미설정 가능)

> CI 테스트(e2e)용 시크릿(`DATABASE_URL`, `JWT_*`, `ENCRYPTION_KEY`, `REDIS_URL`)은 [`.github/workflows/ci.yml`](.github/workflows/ci.yml) 의 서비스 컨테이너에서 주입된다.

## 🚦 프로젝트 상태

🟢 **설계 단계** — 기술 스택 확정(옵션 A: NestJS 모노레포). **DB 스키마(`packages/db`) 작성 완료** (15개 테이블, 초기 migration 생성). API 구현 예정.

## 🗓️ 로드맵 (기획서 WBS 기준)

1. **기획·설계** (4주) — IA, 유저플로우, 기능명세 ✅
2. **개발** (10주) — 핵심 탐색·할인·제보, PG 연동, 판매자·관리자 페이지
3. **내부 QA** (2주)
4. **시범운영** (8주) — 파일럿 지역 30~50개점
5. **정식출시** — 입점 확대, 지속 운영

---

_본 저장소는 기획 문서(기획서·기능명세서·유저플로우)를 기반으로 작성되었습니다._
