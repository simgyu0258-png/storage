# 창고 물품 관리 웹 서비스 (MVP)

부서가 직접 입고/출고/재고조정을 기록하고, 부서별 접근 가능한 창고만 조회할 수 있는 웹 서비스입니다.

## 1) 개발 계획과 기술 스택

### MVP 범위
- 로그인 + 권한(시스템 관리자 / 부서 관리자 / 일반 사용자)
- 부서-창고 접근 권한 기반 조회
- 품목 관리(소모품/비품)
- 재고 조회 + 최소 재고 경고
- 입고/출고/조정 등록
- 입출고/조정 등록 시 작업자명 필수 입력
- 입출고 이력 조회(필터)
- 대시보드 요약

### 기술 스택
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- SQLite (로컬 MVP)
- NextAuth (Credentials 로그인)
- Tailwind CSS

### 왜 이 조합인가
- 설치/실행이 단순해서 비전문가도 로컬 테스트 쉬움
- Prisma로 DB 구조를 코드로 관리 가능
- SQLite로 서버 없이 바로 MVP 검증 가능
- 추후 PostgreSQL로 전환이 쉬움

---

## 2) 데이터 모델 설계

`prisma/schema.prisma` 기준

### 핵심 엔티티
- `User`: 사용자(역할, 부서, 로그인 정보)
- `Department`: 부서
- `Warehouse`: 창고
- `WarehouseDepartmentAccess`: 창고-부서 접근 권한 연결
- `Item`: 품목(소모품/비품, 최소재고, 기본위치 등)
- `Inventory`: 창고별 현재 재고
- `StockTransaction`: 입고/출고/조정 이력
- `ItemCategory`: 품목 카테고리
- `Location`: 창고 내 위치

### 주요 관계
- 사용자 `User` 는 하나의 `Department` 소속
- `Department` 와 `Warehouse` 는 `WarehouseDepartmentAccess` 로 M:N 연결
- 재고 `Inventory` 는 `(warehouseId, itemId)` 유니크
- 모든 변경은 `StockTransaction` 에 기록

### 비즈니스 규칙 반영
- 출고 시 현재 재고 초과 불가
- 조정은 권한자(시스템/부서 관리자)만 가능
- 삭제 대신 `isActive` 비활성화 중심
- 품목코드 `itemCode` 유니크

---

## 3) 화면 구조 설계

### 공통
- `/login`: 로그인
- 상단 메뉴: 대시보드, 재고, 빠른 입출고, 이력, 품목, 창고
- 시스템 관리자만 사용자관리 메뉴 표시

### 화면 목록
- `/dashboard`: 전체 요약 + 부족 재고 + 최근 이력
- `/inventory`: 창고/검색/부족 필터 기반 재고 조회
- `/transactions/new`: 모바일 우선 빠른 입출고/조정 등록
- `/transactions`: 이력 조회 + 기간/창고/품목/부서/유형 필터
- `/items`: 품목 검색/조회, 관리자 등록
- `/items/[id]/edit`: 관리자 품목 수정
- `/warehouses`: 창고 목록, 관리자 접근 부서 연결
- `/warehouses/[id]`: 창고 상세 + 재고
- `/admin/users`: 관리자용 부서/사용자 관리

---

## 4) 실제 코드 구성

### 폴더 구조

```text
warehouse-mvp/
  prisma/
    schema.prisma
    seed.ts
  src/
    app/
      (auth)/login/
      (app)/
        dashboard/
        inventory/
        items/
        transactions/
        warehouses/
        admin/users/
      api/auth/[...nextauth]/
      globals.css
      layout.tsx
      page.tsx
    components/
      QuickTransactionForm.tsx
      NavLink.tsx
      SignOutButton.tsx
    lib/
      auth.ts
      inventory.ts
      permissions.ts
      prisma.ts
      session.ts
      validators.ts
      format.ts
    types/
      next-auth.d.ts
  middleware.ts
  package.json
  tailwind.config.ts
  postcss.config.js
```

### 핵심 구현 포인트
- 인증: `NextAuth Credentials` + DB 사용자 검증
- 권한: 역할 + `WarehouseDepartmentAccess` 기반 창고 접근 제한
- 트랜잭션: `executeStockTransaction()`에서 재고 변경/이력 기록을 하나의 DB 트랜잭션으로 처리
- 재고 신뢰성: 입출고/조정마다 `beforeQty`, `afterQty` 저장
- 빠른 UX: 최근 사용 품목 버튼, 검색어 기반 빠른 품목 선택, 저장 성공/실패 메시지

---

## 5) 실행 방법 (아주 쉽게)

## 사전 준비
1. Node.js LTS 설치 (권장: 20 이상)
2. 터미널에서 프로젝트 폴더 이동

```bash
cd c:\dev\storage\warehouse-mvp
```

## 실행 순서
1. 패키지 설치
```bash
npm install
```

2. 환경변수 파일 생성
```bash
copy .env.example .env
```

3. Prisma 클라이언트 생성 + DB 스키마 적용
```bash
npx prisma generate
npm run db:push
```

4. 샘플 데이터 입력
```bash
npm run db:seed
```

5. 개발 서버 실행
```bash
npm run dev
```

6. 브라우저 접속
- `http://localhost:3000`

---

## 초기 계정 (샘플)
- 시스템 관리자: `admin@company.com / Admin123!`
- 부서 관리자: `itmanager@company.com / Dept123!`
- 일반 사용자: `hruser@company.com / User123!`
- 기본 창고: `12F T-러닝 창고`, `P2 유아 창고`

---

## 초보자 테스트 시나리오

1. 관리자 계정 로그인
2. 대시보드에서 부족 품목/최근 이력 확인
3. `빠른 입출고`에서 출고 등록
4. 재고 화면에서 수량 변경 반영 확인
5. 이력 화면에서 방금 등록 건 필터 조회
6. 사용자관리에서 새 사용자 1명 생성 후 로그인 테스트
7. 창고관리에서 창고명/코드/설명 수정 테스트 (시스템 관리자)

## HTML로 빠른 화면 확인
- 서버 실행 없이 `mvp-preview.html` 파일을 브라우저로 열면 MVP 화면 구성을 미리 확인할 수 있습니다.

---

## 배포 확장 방향

### 바로 확장 가능한 항목
1. SQLite -> PostgreSQL 전환
- `DATABASE_URL`만 변경하고 Prisma 마이그레이션 적용

2. 바코드/QR 검색
- 품목에 `barcode` 필드 추가
- `transactions/new`에서 카메라 입력 컴포넌트 추가

3. 첨부파일
- `StockTransactionAttachment` 테이블 추가
- S3 또는 로컬 스토리지 연동

4. 즐겨찾기 품목
- `UserFavoriteItem` 테이블 추가
- 빠른 입출고 상단 고정

5. CSV/엑셀 다운로드
- 이력 화면 쿼리 결과를 CSV API로 제공

6. 사용량 통계
- 기간/부서/품목별 집계 쿼리 + 차트 페이지

---

## 주의 사항
- 이 저장소는 MVP이며, 운영 전에는 아래 강화 필요:
  - 비밀번호 정책/강제 변경
  - 감사 로그 고도화
  - 입력 감사(왜곡 방지) 및 백업
  - 접근 IP/SSO 연동(사내 정책 반영)

