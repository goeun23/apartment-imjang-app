# App Router 구현 사례: 서버/클라이언트 컴포넌트 분리와 성능 최적화

## 프로젝트 개요

아파트 임장 기록 앱을 Next.js 15 App Router로 구현하며, **서버 컴포넌트 우선 전략**과 **스트리밍 렌더링**을 실제로 적용한 사례입니다.

---

## 1. 서버/클라이언트 컴포넌트 분리: "기본은 서버, 필요한 곳만 클라이언트"

### 핵심 원칙

App Router에서 컴포넌트는 **기본이 Server Component**입니다. 별도 표시(`"use client"`)가 없으면 서버에서 실행/렌더링되며, 브라우저 상호작용(상태, 이펙트, 이벤트 핸들러)이 필요한 경우에만 Client Component로 opt-in합니다.

### 실제 구현 사례

#### A. Server Component로 구현한 페이지들




**1. 홈 페이지 (`app/page.tsx`)**

```typescript
// Server Component (기본)
import { Suspense } from "react"
import { getRecords } from "@/lib/services/recordService.server"
import { getRecentSearches } from "@/lib/services/searchService.server"

async function RecentSearchesSection() {
  const searches = await getRecentSearches() // 서버에서 직접 페칭
  return <RecentSearches searches={searches} />
}

async function RecordListSection() {
  const records = await getRecords() // 서버에서 직접 페칭
  return <RecordList records={records} limit={5} />
}

export default async function Home() {
  return (
    <main>
      <HomeHeader /> {/* Client Component - 로그아웃 버튼만 */}
      <Suspense fallback={...}>
        <RecentSearchesSection />
      </Suspense>
      <Suspense fallback={...}>
        <RecordListSection />
      </Suspense>
    </main>
  )
}
```

**구현 포인트:**
- ✅ `"use client"` 선언 없음 → Server Component
- ✅ `async function`으로 서버에서 직접 데이터 페칭
- ✅ 초기 HTML에 데이터 포함 → 즉시 렌더링
- ✅ 인터랙션(`HomeHeader`)만 Client Component로 분리

**2. 기록 목록 페이지 (`app/records/page.tsx`)**

```typescript
// Server Component
import { Suspense } from "react"
import { getRecords } from "@/lib/services/recordService.server"

async function RecordsListSection() {
  const records = await getRecords() // 서버에서 페칭
  return <RecordsList records={records} />
}

async function RecordsHeader() {
  const records = await getRecords()
  return (
    <div>
      <h1>임장 기록</h1>
      <p>총 {records.length}개의 기록</p>
    </div>
  )
}

export default async function RecordsPage() {
  return (
    <main>
      <Suspense fallback={...}>
        <RecordsHeader />
      </Suspense>
      <Suspense fallback={...}>
        <RecordsListSection />
      </Suspense>
    </main>
  )
}
```

**구현 포인트:**
- ✅ 서버에서 데이터 페칭하여 초기 HTML에 포함
- ✅ Suspense로 각 섹션 독립적으로 스트리밍
- ✅ 클라이언트에서 `useEffect`로 페칭할 필요 없음

**3. 기록 상세 페이지 (`app/records/[id]/page.tsx`)**

```typescript
// Server Component
import type { Metadata } from "next"
import { getRecord } from "@/lib/services/recordService.server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const record = await getRecord(id)
  return {
    title: `${record.apartment_name} - 아파트 임장 기록`,
    description: `${record.region_si} ${record.region_gu} 임장 정보`,
    openGraph: {
      images: record.record_photos[0]?.photo_url ? [record.record_photos[0].photo_url] : [],
    },
  }
}

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const record = await getRecord(id) // 서버에서 페칭
  const currentUserId = await getCurrentUserId()
  
  return <RecordDetailClient record={record} currentUserId={currentUserId} />
}
```

**구현 포인트:**
- ✅ `generateMetadata`로 동적 메타데이터 생성
- ✅ 서버에서 데이터 페칭하여 초기 렌더링에 포함
- ✅ 인터랙션(`RecordDetailClient`)만 Client Component로 분리

#### B. "섬(Island)" 패턴: Client Component 선택적 사용

**인터랙션이 필요한 부분만 Client Component로 분리:**

```typescript
// components/HomeHeader.tsx
"use client" // 인터랙션(로그아웃 버튼)만 클라이언트

import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function HomeHeader() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div>
      <h1>아파트 임장 기록</h1>
      <button onClick={handleLogout}>로그아웃</button>
    </div>
  )
}
```

```typescript
// components/RecordDetailClient.tsx
"use client" // 댓글 추가, 삭제 등 인터랙션만 클라이언트

export default function RecordDetailClient({ record, currentUserId }) {
  const [record, setRecord] = useState(initialRecord)
  
  const handleAddComment = async (content: string) => {
    // 댓글 추가 로직
  }
  
  const handleDelete = async () => {
    // 삭제 로직
  }
  
  return (
    <main>
      {/* 정적 콘텐츠는 서버에서 렌더링된 것 사용 */}
      <RecordCard contents={<RecordImages photos={record.record_photos} />} />
      {/* 인터랙션만 클라이언트에서 처리 */}
      <RecordComments onAddComment={handleAddComment} />
    </main>
  )
}
```

**구현 포인트:**
- ✅ 데이터 페칭과 정적 렌더링은 Server Component
- ✅ 인터랙션(버튼 클릭, 폼 제출)만 Client Component
- ✅ 결과: 필요한 부분만 하이드레이션 → JS 번들 크기 감소

#### C. 서버 컴포넌트용 데이터 페칭 함수

**서버 전용 함수 생성:**

```typescript
// lib/services/recordService.server.ts
import { createClient } from "@/lib/supabase/server"

export const getRecords = async () => {
  const supabase = await createClient() // 서버 클라이언트
  const { data, error } = await supabase
    .from("records")
    .select("*, record_photos (*)")
    .order("created_at", { ascending: false })
  
  return data
}
```

**구현 포인트:**
- ✅ `.server.ts` 확장자로 서버 전용 함수 명시
- ✅ `createClient()`로 서버 사이드 Supabase 클라이언트 사용
- ✅ 클라이언트 번들에 포함되지 않음

---

## 2. 렌더링 최적화: "적은 JS + 스트리밍 + 캐싱"

### (1) 적은 JS(하이드레이션 최소화)

**App Router의 동작 방식:**

1. **초기 로드**: 브라우저는 HTML로 빠르게 화면 표시
2. **RSC Payload**: 서버 컴포넌트 트리 정보 전달
3. **선택적 하이드레이션**: Client Component만 하이드레이션

**실제 구현 효과:**

```typescript
// Before (Client Component)
"use client"
export default function HomePage() {
  const [records, setRecords] = useState([])
  useEffect(() => {
    getRecords().then(setRecords) // 클라이언트에서 페칭
  }, [])
  // 전체 페이지가 하이드레이션 대상
}

// After (Server Component)
export default async function HomePage() {
  const records = await getRecords() // 서버에서 페칭
  return <RecordList records={records} />
  // Server Component는 하이드레이션 불필요
  // Client Component(HomeHeader)만 하이드레이션
}
```

**측정 가능한 개선:**
- ✅ 초기 JavaScript 번들 크기 감소 (데이터 페칭 로직 제거)
- ✅ 하이드레이션 대상 컴포넌트 감소 (Server Component 제외)
- ✅ TTI(Time to Interactive) 개선

### (2) 스트리밍/점진적 렌더링

**Suspense를 활용한 스트리밍 구현:**

```typescript
// app/page.tsx
import { Suspense } from "react"

async function RecentSearchesSection() {
  const searches = await getRecentSearches() // 비동기 페칭
  return <RecentSearches searches={searches} />
}

async function RecordListSection() {
  const records = await getRecords() // 비동기 페칭
  return <RecordList records={records} />
}

export default async function Home() {
  return (
    <main>
      <HomeHeader /> {/* 즉시 표시 */}
      
      {/* 각 섹션이 독립적으로 스트리밍 */}
      <Suspense fallback={<div>최근 검색 로딩 중...</div>}>
        <RecentSearchesSection />
      </Suspense>
      
      <Suspense fallback={<RecordListSkeleton />}>
        <RecordListSection />
      </Suspense>
    </main>
  )
}
```

**스트리밍 동작:**
1. 레이아웃과 `HomeHeader`는 즉시 표시
2. `RecentSearchesSection` 데이터 준비되면 스트리밍
3. `RecordListSection` 데이터 준비되면 스트리밍
4. 각 섹션이 독립적으로 로딩 → 사용자는 부분 콘텐츠를 먼저 볼 수 있음

**로딩 UI 분리:**

```typescript
// app/records/loading.tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
      <div className="text-gray-500">로딩 중...</div>
    </main>
  )
}
```

- ✅ 각 라우트별로 `loading.tsx` 생성
- ✅ 페이지 전환 시 자동으로 로딩 UI 표시
- ✅ 사용자 경험 개선 (빈 화면 대신 로딩 표시)

### (3) 라우트 단위 캐싱

**Next.js의 자동 캐싱:**

```typescript
// app/records/page.tsx
export default async function RecordsPage() {
  const records = await getRecords() // 서버에서 페칭
  
  // Next.js가 자동으로:
  // 1. 정적 렌더링 결과를 Full Route Cache에 저장
  // 2. 재방문 시 캐시된 HTML 재사용
  // 3. 필요 시 재검증(revalidate)
  
  return <RecordsList records={records} />
}
```

**캐싱 전략 제어 (향후 개선 가능):**

```typescript
// Route Segment Config
export const revalidate = 60 // 60초마다 재검증

// 또는 동적 렌더링 강제
export const dynamic = 'force-dynamic'
```

**구현 포인트:**
- ✅ 정적 페이지는 자동으로 캐싱
- ✅ 렌더링 작업 자체를 줄여 성능 개선
- ✅ Route Segment Config로 세밀한 제어 가능

---

## 3. SEO 친화적 구조: "서버에서 HTML/메타데이터를 '정석'으로 만든다"

### Metadata API 활용

**정적 메타데이터 (`app/layout.tsx`):**

```typescript
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "아파트 임장 기록",
  description: "아파트 임장 정보를 기록하고 관리하는 앱",
}
```

**동적 메타데이터 (`app/records/[id]/page.tsx`):**

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const record = await getRecord(id) // 서버에서 데이터 페칭
  
  return {
    title: `${record.apartment_name || "임장 기록"} - 아파트 임장 기록`,
    description: `${record.region_si} ${record.region_gu} ${
      record.apartment_name || ""
    } 임장 정보`,
    openGraph: {
      images: record.record_photos[0]?.photo_url
        ? [record.record_photos[0].photo_url]
        : [],
    },
  }
}
```

**구현 포인트:**
- ✅ 서버에서 메타데이터 생성 → HTML `<head>`에 포함
- ✅ 각 기록 페이지마다 고유한 메타데이터
- ✅ Open Graph 이미지 자동 설정 → 소셜 공유 최적화
- ✅ 크롤러가 즉시 읽을 수 있는 형태

### HTML-first 렌더링

**App Router의 렌더링 순서:**

1. **서버에서 HTML 생성** (메타데이터 포함)
2. **클라이언트로 전송**
3. **필요한 부분만 하이드레이션**

**실제 구현 예시:**

```typescript
// app/records/[id]/page.tsx
export default async function RecordDetailPage({ params }) {
  const record = await getRecord(id) // 서버에서 페칭
  
  // 서버에서 렌더링된 HTML:
  // <html>
  //   <head>
  //     <title>은마아파트 - 아파트 임장 기록</title>
  //     <meta property="og:image" content="https://..." />
  //   </head>
  //   <body>
  //     <main>
  //       <h1>은마아파트</h1>
  //       <p>서울 강남구...</p>
  //       <!-- 데이터가 이미 포함됨 -->
  //     </main>
  //   </body>
  // </html>
  
  return <RecordDetailClient record={record} />
}
```

**Pages Router와의 차이:**

- **Pages Router**: 클라이언트에서 렌더링 후 `next/head`로 메타데이터 주입
- **App Router**: 서버에서 HTML 생성 시 메타데이터 포함 → 크롤러가 즉시 읽을 수 있음

---

## 4. 실제 구현 결과

### 성능 개선

1. **초기 로드 시간 단축**
   - 서버에서 데이터 페칭 → 초기 HTML에 데이터 포함
   - 클라이언트에서 `useEffect`로 페칭할 필요 없음
   - 즉시 렌더링 가능

2. **JavaScript 번들 크기 감소**
   - 데이터 페칭 로직이 서버로 이동
   - Server Component는 하이드레이션 불필요
   - Client Component만 번들에 포함

3. **사용자 경험 개선**
   - Suspense로 레이아웃 먼저 표시
   - 데이터는 점진적으로 스트리밍
   - "로딩 중..." 대신 부분 콘텐츠 표시

### SEO 최적화

1. **검색엔진 크롤링**
   - 서버에서 완전한 HTML 생성
   - 메타데이터가 HTML에 포함
   - 크롤러가 즉시 읽을 수 있음

2. **소셜 공유 최적화**
   - Open Graph 이미지 자동 설정
   - 각 기록마다 고유한 메타데이터
   - 소셜 미디어에서 올바른 미리보기 표시

### 코드 구조 개선

1. **관심사 분리**
   - 데이터 페칭: Server Component
   - 인터랙션: Client Component
   - 명확한 책임 분리

2. **재사용성 향상**
   - Server Component는 순수 함수처럼 동작
   - Client Component는 인터랙션만 처리
   - 테스트와 유지보수 용이

---

## 5. 트레이드오프와 한계

### 현재 구조의 한계

1. **실시간 업데이트**
   - 서버 컴포넌트는 초기 렌더링만 처리
   - 실시간 업데이트가 필요한 경우 Client Component 필요
   - 예: 댓글 추가 후 목록 갱신

2. **인증 처리**
   - 서버에서 세션 확인 필요
   - 미들웨어와 서버 컴포넌트에서 중복 체크 가능
   - 최적화 필요

### 개선 방향

1. **하이브리드 접근**
   - 초기 데이터: Server Component
   - 실시간 업데이트: Client Component + SWR/React Query
   - 최적의 성능과 UX 균형

2. **캐싱 전략**
   - Route Segment Config로 캐싱 제어
   - ISR(Incremental Static Regeneration) 활용
   - 성능과 최신성의 균형

---

## 결론

이 프로젝트는 **App Router의 핵심 원칙을 실제로 구현**한 사례입니다:

1. ✅ **서버 우선**: 기본은 Server Component, 필요한 곳만 Client Component
2. ✅ **스트리밍**: Suspense로 점진적 렌더링 구현
3. ✅ **SEO 최적화**: Metadata API로 동적 메타데이터 생성
4. ✅ **성능 개선**: 부분 하이드레이션으로 JS 번들 크기 감소

**핵심 교훈:**
- App Router는 단순히 "최신 기술"이 아니라, **실제 성능과 사용자 경험을 개선하는 도구**입니다.
- 서버/클라이언트 컴포넌트를 적절히 분리하면, **코드 구조도 개선되고 성능도 향상**됩니다.
- **점진적 개선**이 가능합니다. 모든 것을 한 번에 바꿀 필요 없이, 중요한 부분부터 서버 컴포넌트로 전환할 수 있습니다.

