# CLAUDE.md — 창고 물품 관리 MVP

이 문서는 Claude Code가 이 프로젝트에서 작업할 때 필요한 컨텍스트를 담고 있습니다.

---

## 프로젝트 개요

부서가 직접 입고/출고/재고조정을 기록하는 사내 창고 물품 관리 웹 서비스입니다.
- **현재 상태**: 로컬 SQLite 기반 MVP
- **핵심 특징**: 부서-창고 접근 권한 체계, 모바일 우선 빠른 입출고 UI, 이력 전수 보존
- **향후 확장**: SQLite → PostgreSQL 전환 예정 (Prisma 덕분에 `DATABASE_URL` 변경만으로 가능)

---

## 기술 스택

| 항목 | 버전/내용 |
|------|-----------|
| Next.js | 14 (App Router, Server Actions) |
| TypeScript | 5.6 |
| Prisma ORM | 5.22 |
| DB | SQLite (`prisma/dev.db`) |
| 인증 | NextAuth v4 (Credentials + JWT 세션) |
| CSS | Tailwind CSS 3.4 |
| 유효성 검증 | Zod 3.23 |
| 비밀번호 해싱 | bcryptjs |

---

## 개발 환경 세팅

```bash
# 1. 패키지 설치
npm install

# 2. 환경변수 설정 (최초 1회)
cp .env.example .env

# 3. Prisma 클라이언트 생성 + DB 스키마 적용
npx prisma generate
npm run db:push

# 4. 샘플 데이터 투입
npm run db:seed

# 5. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

### 주요 명령어

```bash
npm run dev         # 개발 서버 (Next.js)
npm run build       # prisma generate + next build
npm run lint        # ESLint
npm run db:push     # 스키마 변경사항을 DB에 반영 (마이그레이션 없이)
npm run db:seed     # 샘플 데이터 입력 (prisma/seed.ts)
npm run db:reset    # DB 초기화 후 seed 재투입
```

> **주의**: `npm run db:reset`은 모든 데이터를 삭제합니다. 운영 중 실행 금지.

---

## 환경 변수 (`.env`)

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change_this_to_long_random_string   # 반드시 강력한 값으로 변경
DATABASE_URL="file:./dev.db"
```

---

## 폴더 구조

```
warehouse-mvp/
├── prisma/
│   ├── schema.prisma       # DB 모델 정의 (단일 진실 공급원)
│   └── seed.ts             # 샘플 데이터 (부서/사용자/창고/품목/재고)
├── src/
│   ├── app/
│   │   ├── (auth)/login/   # 로그인 페이지 (인증 불필요 라우트)
│   │   ├── (app)/          # 인증 필요 라우트 (layout.tsx에서 세션 검사)
│   │   │   ├── dashboard/
│   │   │   ├── inventory/
│   │   │   ├── items/
│   │   │   ├── transactions/
│   │   │   ├── warehouses/
│   │   │   └── admin/users/   # SYSTEM_ADMIN 전용
│   │   └── api/auth/[...nextauth]/  # NextAuth 핸들러
│   ├── components/
│   │   ├── QuickTransactionForm.tsx  # 빠른 입출고 클라이언트 컴포넌트
│   │   ├── NavLink.tsx              # active 상태 처리 네비 링크
│   │   └── SignOutButton.tsx        # 로그아웃 버튼
│   ├── lib/
│   │   ├── auth.ts          # NextAuth 설정 (authOptions, getAuthSession)
│   │   ├── inventory.ts     # executeStockTransaction() — 핵심 비즈니스 로직
│   │   ├── permissions.ts   # 역할/접근권한 체크 함수들
│   │   ├── prisma.ts        # Prisma 클라이언트 싱글턴
│   │   ├── session.ts       # requireUser() — Server Action 인증 가드
│   │   ├── validators.ts    # Zod 스키마 (itemSchema, stockTransactionSchema 등)
│   │   └── format.ts        # 레이블/날짜 포맷 유틸 (한국어)
│   └── types/
│       └── next-auth.d.ts   # Session에 id/role/departmentId/departmentName 추가
├── middleware.ts             # JWT 검사 → 미인증 시 /login 리다이렉트
└── next.config.js           # serverActions.bodySizeLimit: 2mb
```

---

## 데이터 모델

`prisma/schema.prisma`가 단일 진실 공급원입니다.

### 핵심 엔티티

| 모델 | 역할 |
|------|------|
| `User` | 사용자 (역할, 부서, 로그인 정보) |
| `Department` | 부서 |
| `Warehouse` | 창고 |
| `WarehouseDepartmentAccess` | 창고-부서 M:N 접근 권한 |
| `Item` | 품목 (소모품/비품, 최소재고, 기본위치) |
| `Inventory` | 창고별 현재 재고 (`warehouseId + itemId` 유니크) |
| `StockTransaction` | 모든 입고/출고/조정 이력 (불변 로그) |
| `ItemCategory` | 품목 카테고리 |
| `Location` | 창고 내 위치 |

### 주요 관계

- `User` → `Department` (N:1)
- `Department` ↔ `Warehouse` via `WarehouseDepartmentAccess` (M:N)
- `Inventory` = `(warehouseId, itemId)` 복합 유니크
- `StockTransaction`에는 `beforeQty`, `afterQty` 항상 저장

### 비즈니스 규칙 (코드에 반영됨)

- 출고 수량이 현재 재고를 초과하면 에러 (`executeStockTransaction`)
- 재고 조정(ADJUST)은 `SYSTEM_ADMIN` 또는 `DEPT_ADMIN`만 가능
- 재고 조정 시 `reason` 필드 필수
- 삭제 없음 — `isActive: false`로 비활성화 (User, Item, Warehouse, Location, ItemCategory)
- `itemCode`는 유니크, `(name, specification, unit)` 복합 유니크

---

## 권한 체계

### 역할 3단계

| 역할 | `UserRole` 값 | 권한 |
|------|---------------|------|
| 시스템 관리자 | `SYSTEM_ADMIN` | 모든 창고 접근 + 마스터 관리 (품목/창고/사용자) |
| 부서 관리자 | `DEPT_ADMIN` | 소속 부서 접근 창고 + 재고 조정 가능 |
| 일반 사용자 | `USER` | 소속 부서 접근 창고 + 입고/출고만 가능 |

### 창고 접근 제어

`SYSTEM_ADMIN`은 모든 창고에 접근합니다.
그 외 역할은 `WarehouseDepartmentAccess` 테이블에 `(warehouseId, departmentId)` 레코드가 있어야 접근 가능합니다.

### 권한 체크 함수 (`src/lib/permissions.ts`)

```typescript
isSystemAdmin(role)          // SYSTEM_ADMIN 여부
canAdjustStock(role)         // SYSTEM_ADMIN | DEPT_ADMIN
canManageMaster(role)        // SYSTEM_ADMIN 전용 (품목/창고/사용자/부서 CUD)
getAccessibleWarehouseIds()  // 접근 가능 창고 ID 목록 (비동기)
assertWarehouseAccess()      // 특정 창고 접근 가능 여부 검사 (비동기)
```

---

## 핵심 패턴

### 1. Server Action 인증 가드

모든 Server Action 첫 줄에서 `requireUser()`를 호출합니다.

```typescript
"use server";
export async function someAction(formData: FormData) {
  const user = await requireUser();          // 미인증 시 /login 리다이렉트
  if (!canManageMaster(user.role)) throw new Error("권한이 없습니다.");
  // ...
  revalidatePath("/some-path");
  redirect("/some-path");
}
```

### 2. 재고 변경 — `executeStockTransaction()`

`src/lib/inventory.ts`의 `executeStockTransaction()`이 재고 변경의 **유일한 진입점**입니다.
- Prisma `$transaction` 안에서 `Inventory` upsert + `StockTransaction` create를 원자적으로 처리
- 비즈니스 규칙 검증(수량, 권한, 창고 접근)도 이 함수 내에서 처리
- 직접 `prisma.inventory.update()`로 재고를 수정하지 마세요.

### 3. Zod 유효성 검증

Server Action에서 `formData`를 파싱할 때 `src/lib/validators.ts`의 Zod 스키마를 사용합니다.
새 폼이 생기면 이 파일에 스키마를 추가하세요.

### 4. 에러 처리 패턴 (Server Action)

`redirect()`는 내부적으로 예외를 던지므로 `try/catch` 안에서 `redirect()` 사용 시 주의가 필요합니다.
현재 `transactions/actions.ts` 패턴처럼 catch에서 에러 메시지를 쿼리 파라미터로 전달합니다.

```typescript
try {
  // ...
  redirect("/transactions/new?ok=1");
} catch (error) {
  const message = error instanceof Error ? error.message : "오류가 발생했습니다.";
  redirect(`/transactions/new?error=${encodeURIComponent(message)}`);
}
```

### 5. 레이블 함수 (`src/lib/format.ts`)

UI에서 역할/트랜잭션 타입/품목 타입을 한국어로 표시할 때 반드시 이 유틸을 사용합니다.

```typescript
roleLabel("SYSTEM_ADMIN")  // "시스템 관리자"
txTypeLabel("IN")          // "입고"
itemTypeLabel("CONSUMABLE") // "소모품"
formatDateTime(date)        // "2024. 01. 15. 09:30" (ko-KR)
```

---

## 테스트 계정 (seed 데이터)

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 시스템 관리자 | `admin@company.com` | `Admin123!` |
| 부서 관리자 | `itmanager@company.com` | `Dept123!` |
| 일반 사용자 | `hruser@company.com` | `User123!` |

기본 창고: `12F T-러닝 창고`, `P2 유아 창고`

---

## Vercel 배포 가이드

### 인프라 구성: GitHub + Supabase + Vercel

### 1) Supabase DB 설정

1. [supabase.com](https://supabase.com) → 프로젝트 생성
2. Settings → Database → Connection string에서 두 URL 복사:
   - **Transaction pooler** (포트 6543) → `DATABASE_URL`
   - **Direct connection** (포트 5432) → `DIRECT_URL`
3. 로컬 `.env` 파일에 두 값 모두 입력

> `DATABASE_URL`은 Vercel 서버리스 함수가 사용하는 연결 풀러,  
> `DIRECT_URL`은 `prisma migrate`가 직접 연결할 때 사용.

### 2) 최초 마이그레이션 생성 (로컬, 1회)

```bash
npm install
npm run db:migrate   # 이름 입력: init
npm run db:seed      # 샘플 데이터 투입 (Supabase DB에 직접 입력됨)
git add prisma/migrations
git commit -m "chore: add initial prisma migration"
```

### 3) GitHub push

```bash
git remote add origin https://github.com/<계정>/<repo>.git
git push -u origin master
```

### 4) Vercel 연결

1. [vercel.com](https://vercel.com) → Import Project → GitHub repo 선택
2. Settings → Environment Variables에 4개 추가:
   - `DATABASE_URL` — Supabase Transaction pooler URL (포트 6543)
   - `DIRECT_URL` — Supabase Direct connection URL (포트 5432)
   - `NEXTAUTH_SECRET` — 강력한 랜덤값 (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — `https://your-app.vercel.app`

### 빌드 흐름 (자동)

Vercel이 `npm run build`를 실행하면:
1. `prisma generate` — Prisma 클라이언트 생성
2. `prisma migrate deploy` — 커밋된 migration을 DB에 적용 (DIRECT_URL 사용)
3. `next build` — Next.js 빌드

### 스키마 변경 시 워크플로

```bash
# 1. schema.prisma 수정
# 2. 로컬에서 migration 생성 및 커밋
npm run db:migrate
git add prisma/migrations && git commit -m "..."
git push   # → Vercel 자동 재배포 시 migrate deploy 실행됨
```

---

## 스키마 변경 시 주의사항

1. `prisma/schema.prisma` 수정
2. `npm run db:push` 실행 (SQLite이므로 마이그레이션 대신 push 사용)
3. `npx prisma generate` 실행 (클라이언트 재생성)
4. 필요 시 `prisma/seed.ts` 업데이트

> PostgreSQL로 전환 시에는 `db:push` 대신 `prisma migrate dev`를 사용해야 합니다.
