# App Router 선택 이유 및 활용 분석

## 프로젝트 정보
- **Next.js 버전**: 15 (App Router)
- **구조**: 파일 기반 라우팅 (`app/` 디렉토리)
- **렌더링 전략**: Client Components 위주 (모든 page.tsx에 "use client")

---

## 1. App Router를 선택한 이유

### 면접 시 답변:

**"Pages Router 대신 App Router를 선택한 이유는?"**

"이 프로젝트는 **2024년 11월에 시작**했고, Next.js 15가 릴리즈된 시점이었습니다. 다음 이유로 App Router를 선택했습니다:

### 1) **미래 지향적 선택**
- Next.js 13부터 App Router가 stable이 되었고, Pages Router는 레거시로 전환 중
- Vercel의 공식 권장사항이 App Router
- 장기적으로 유지보수할 프로젝트이므로 최신 패러다임 채택

### 2) **Supabase Auth Helpers 최신 버전 호환**
- `@supabase/auth-helpers-nextjs` v0.10.0은 App Router 전용 API 제공
- `createRouteHandlerClient()`, `createServerComponentClient()` 등 App Router 최적화 함수 사용

### 3) **레이아웃 공유 최적화**
- 하단 네비게이션(`BottomNav`)을 Root Layout에 한 번만 정의
- 페이지 전환 시 레이아웃 리렌더링 없음 (성능 향상)

### 4) **API Routes 개선**
- `app/api/market-price/route.ts` 같은 명확한 파일명
- HTTP 메서드별 명시적 함수 (`GET`, `POST` export)
- `cookies()` 헬퍼로 서버 측 쿠키 접근 간편

### 5) **Metadata API**
- `layout.tsx`에서 `export const metadata`로 SEO 메타데이터 정의
- Pages Router의 `Head` 컴포넌트보다 타입 안전

---

## 2. App Router의 실제 활용 사례

### ✅ 활용 1: Root Layout으로 공통 UI 관리

**파일:** `app/layout.tsx:17-30`

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.className} antialiased pb-16`}>
        {children}
        <BottomNav />  {/* 모든 페이지에서 공유 */}
      </body>
    </html>
  )
}
```

**장점:**
- ✅ `<BottomNav />` 컴포넌트가 페이지 전환 시 **언마운트되지 않음**
- ✅ Pages Router에서는 `_app.tsx`에서 했던 작업을 더 명확하게 표현
- ✅ `pb-16` (padding-bottom 4rem)으로 하단 네비 공간 확보를 전역 적용

**Pages Router와의 차이:**
```typescript
// Pages Router (_app.tsx)
function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <BottomNav />
    </>
  )
}

// App Router (layout.tsx)
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
```
→ App Router가 더 **semantic**하고 HTML 구조가 명확

---

### ✅ 활용 2: Font Optimization (자동 최적화)

**파일:** `app/layout.tsx:6-10`

```typescript
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
})
```

**App Router의 장점:**
- ✅ `next/font/google`이 빌드 타임에 폰트 파일 자동 다운로드
- ✅ Self-hosting으로 GDPR 준수 및 로딩 속도 향상
- ✅ FOUT (Flash of Unstyled Text) 자동 방지
- ✅ Pages Router에서도 가능하지만, App Router의 레이아웃 시스템과 더 잘 통합됨

**실제 효과:**
- Google Fonts CDN 요청 없음 → 외부 의존성 제거
- CSS 변수(`--font-noto-sans-kr`)로 Tailwind와 통합 가능

---

### ✅ 활용 3: API Route Handlers (명시적 HTTP 메서드)

**파일:** `app/api/market-price/route.ts:5-14`

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const regionCode = searchParams.get("regionCode")
  const yearMonth = searchParams.get("yearMonth")

  if (!regionCode || !yearMonth) {
    return NextResponse.json(
      { error: "Missing regionCode or yearMonth" },
      { status: 400 }
    )
  }
  // ...
}
```

**App Router의 개선점:**

| 항목 | Pages Router | App Router |
|------|--------------|------------|
| 파일명 | `/pages/api/market-price.ts` | `/app/api/market-price/route.ts` |
| 메서드 분리 | `if (req.method === 'GET')` | `export async function GET()` |
| 타입 안전성 | `NextApiRequest, NextApiResponse` | Web Standard `Request, Response` |
| URL 파싱 | `req.query` | `new URL(request.url).searchParams` |

**장점:**
- ✅ HTTP 메서드별로 함수 분리 → 가독성 향상
- ✅ Web Standard API 사용 → Edge Runtime 호환
- ✅ `NextResponse.json()`으로 응답 생성 간편

**Pages Router 코드 비교:**
```typescript
// Pages Router
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const { regionCode, yearMonth } = req.query
  // ...
  res.status(200).json(data)
}

// App Router
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const regionCode = searchParams.get("regionCode")
  // ...
  return NextResponse.json(data)
}
```

---

### ✅ 활용 4: Auth Callback Route (서버 컴포넌트 헬퍼)

**파일:** `app/auth/callback/route.ts:5-16`

```typescript
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()  // App Router 전용 헬퍼
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

**App Router 전용 기능:**
- ✅ `cookies()` 헬퍼로 서버 측 쿠키 직접 접근
- ✅ `NextResponse.redirect()`로 타입 안전 리다이렉트
- ✅ Supabase Auth Helpers의 `createRouteHandlerClient()` 사용

**Pages Router와의 차이:**
```typescript
// Pages Router
export default async function handler(req, res) {
  const { code } = req.query
  if (code) {
    const supabase = createPagesServerClient({ req, res })
    await supabase.auth.exchangeCodeForSession(code)
  }
  res.redirect(307, '/')
}

// App Router - 더 명확하고 타입 안전
```

---

### ✅ 활용 5: Metadata API (SEO 최적화)

**파일:** `app/layout.tsx:12-15`

```typescript
export const metadata: Metadata = {
  title: "아파트 임장 기록",
  description: "아파트 임장 정보를 기록하고 관리하는 앱",
}
```

**App Router의 장점:**
- ✅ TypeScript로 타입 검증 (`Metadata` 타입)
- ✅ 정적 export로 빌드 타임 최적화
- ✅ Pages Router의 `<Head>` 컴포넌트보다 간결

**Pages Router 비교:**
```typescript
// Pages Router (_app.tsx)
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>아파트 임장 기록</title>
        <meta name="description" content="..." />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

// App Router - 더 선언적
export const metadata = {
  title: "아파트 임장 기록",
  description: "...",
}
```

---

### ✅ 활용 6: Nested Routing (파일 기반 계층 구조)

**디렉토리 구조:**
```
app/
├── records/
│   ├── page.tsx              → /records (목록)
│   ├── new/
│   │   └── page.tsx          → /records/new (등록)
│   ├── [id]/
│   │   ├── page.tsx          → /records/123 (상세)
│   │   └── edit/
│   │       └── page.tsx      → /records/123/edit (수정)
│   └── filter/
│       └── page.tsx          → /records/filter (필터)
```

**App Router의 장점:**
- ✅ 폴더 구조가 URL 구조와 **1:1 매칭**
- ✅ Dynamic Segment `[id]`가 직관적
- ✅ Nested Layout 가능 (필요 시 `records/layout.tsx` 추가)

**Pages Router와의 차이:**
```
// Pages Router
pages/
├── records/
│   ├── index.tsx           → /records
│   ├── new.tsx             → /records/new
│   ├── [id].tsx            → /records/123
│   ├── [id]/edit.tsx       → ❌ 안 됨 (pages/records/[id]/edit.tsx 필요)
│   └── filter.tsx          → /records/filter
```
→ Pages Router는 `[id]/edit` 같은 깊은 계층이 어색함

---

## 3. App Router의 한계와 대응

### 한계 1: 모든 페이지가 "use client"

**현황:**
- `app/page.tsx`, `app/records/page.tsx` 등 모든 페이지에 `"use client"` 선언

**이유:**
- useState, useEffect, 이벤트 핸들러 등 클라이언트 기능 사용
- Supabase의 `createClientComponentClient()` 사용

**트레이드오프:**
- ❌ Server Component의 장점(서버 데이터 페칭) 활용 못함
- ✅ 대신 모든 데이터가 실시간 업데이트 (사용자 경험 우선)

**개선 가능성:**
```typescript
// 현재 (Client Component)
"use client"
export default function HomePage() {
  const [records, setRecords] = useState([])
  useEffect(() => {
    getRecords().then(setRecords)
  }, [])
  // ...
}

// 개선안 (Server Component + Client Component 분리)
// app/page.tsx (Server Component)
export default async function HomePage() {
  const records = await getRecordsServer()  // 서버에서 페칭
  return <RecordList initialRecords={records} />
}

// components/RecordList.tsx (Client Component)
"use client"
export function RecordList({ initialRecords }) {
  const [records, setRecords] = useState(initialRecords)
  // 실시간 업데이트 로직...
}
```

### 한계 2: Middleware 복잡도

**파일:** `middleware.ts:5-24`

```typescript
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  // 인증 체크
  if (!session && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return res
}
```

**App Router 특유의 이슈:**
- Middleware가 모든 요청마다 실행 → 성능 고려 필요
- `matcher` 설정으로 API 라우트 제외해야 함

---

## 4. 면접 질문 대응

### Q1: "App Router를 선택한 이유는?"

**답변:**
"2024년 11월 프로젝트 시작 시점에 Next.js 15가 릴리즈되었고, Vercel의 공식 권장사항이 App Router였습니다. 주요 이유는:

1. **Supabase Auth Helpers 호환**: v0.10.0이 App Router 전용 API 제공
2. **레이아웃 최적화**: Root Layout에 하단 네비게이션을 한 번만 정의, 페이지 전환 시 리렌더링 없음
3. **API Routes 개선**: HTTP 메서드별 명시적 함수로 가독성 향상
4. **미래 지향**: Pages Router가 레거시화되는 추세, 장기 유지보수 고려

실제로 `cookies()` 헬퍼나 `NextResponse` 같은 App Router 전용 기능을 auth callback에서 활용했습니다."

### Q2: "Server Component를 사용하지 않은 이유는?"

**답변:**
"모든 페이지가 'use client'인 이유는:

1. **실시간 상태 관리**: useState, useEffect로 Supabase 실시간 업데이트 구현
2. **사용자 인터랙션**: 폼 입력, 필터링, 사진 업로드 등 클라이언트 기능 다수
3. **Supabase Client API**: `createClientComponentClient()`가 RLS 정책 활용에 적합

다만 추후 최적화를 위해 Server Component + Client Component 분리를 고려 중입니다. 예를 들어 초기 데이터는 서버에서 페칭하고, 실시간 업데이트만 클라이언트에서 처리하는 방식입니다."

### Q3: "App Router의 장점을 실제로 체감했나요?"

**답변:**
"네, 특히 세 가지 부분에서 체감했습니다:

1. **Root Layout의 레이아웃 유지**
   - 하단 네비게이션이 페이지 전환 시 깜빡임 없음
   - Pages Router에서는 `_app.tsx`에서 했던 작업이 더 명확해짐

2. **API Routes의 명확성**
   - `export async function GET()`으로 메서드 분리
   - `if (req.method === 'GET')` 같은 분기문 불필요

3. **Font Optimization**
   - `next/font/google`로 Noto Sans KR을 빌드 타임에 최적화
   - FOUT 방지 및 외부 CDN 의존성 제거

물론 Server Component를 제대로 활용하지 못한 점은 아쉬움으로 남습니다."

---

## 5. 개선 방향

**"App Router를 더 잘 활용하려면?"**

1. **Server Component 도입**
   ```typescript
   // app/records/page.tsx
   async function RecordsPage() {
     const initialRecords = await getRecordsServer()  // 서버 페칭
     return <RecordList initialRecords={initialRecords} />
   }
   ```

2. **Streaming & Suspense**
   ```typescript
   export default function RecordsPage() {
     return (
       <Suspense fallback={<RecordsSkeleton />}>
         <RecordList />
       </Suspense>
     )
   }
   ```

3. **Parallel Routes (모달)**
   ```
   app/
   ├── @modal/
   │   └── records/
   │       └── [id]/
   │           └── page.tsx  → 모달로 상세보기
   └── records/
       └── page.tsx          → 목록 페이지
   ```

---

## 결론

### App Router 선택의 핵심 이유:

1. ✅ **최신 기술 스택**: Next.js 15, Supabase Auth Helpers v0.10 호환
2. ✅ **레이아웃 최적화**: Root Layout으로 공통 UI 관리, 리렌더링 방지
3. ✅ **API Routes 개선**: 명시적 HTTP 메서드, Web Standard API
4. ✅ **Metadata API**: 타입 안전 SEO 설정
5. ✅ **Font Optimization**: 자동 폰트 최적화

### 아쉬운 점:

- ❌ Server Component 미활용 (모든 페이지가 "use client")
- ❌ Streaming, Suspense 미사용

### 배운 점:

**"App Router를 선택했지만 모든 기능을 활용하지는 못했습니다. 다만 클라이언트 중심 앱(실시간 업데이트, 인터랙션 다수)의 특성상 Client Component가 적합했고, 추후 성능 최적화가 필요하면 Server Component로 점진적 마이그레이션할 수 있습니다."**

면접에서는 **"왜 선택했는가"**뿐만 아니라 **"어떻게 활용했고, 어떤 한계가 있었는가"**를 솔직하게 설명하는 것이 중요합니다.
