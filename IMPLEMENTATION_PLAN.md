# 아파트 임장 기록 앱 - 기술 기획서

## 프로젝트 개요

모바일 웹 기반 아파트 임장 기록 및 시세 조회 앱. 사용자가 아파트 현장 방문(임장) 정보를 기록하고, 실시간 시세를 조회하며, 대출 계산을 수행할 수 있는 올인원 부동산 관리 도구.

### 목표

- 📱 모바일 최적화된 반응형 웹 앱
- 💾 체계적인 임장 기록 관리 및 필터링
- 📊 공공 데이터 기반 실시간 시세 조회
- 🤖 AI 기반 임장 분석 리포트 생성 (친근한 톤)
- 💰 LTV 규제 반영 대출 계산기

---

## 확정 사항 ✅

사용자 피드백을 반영한 최종 결정사항:

1. **AI 리포트 톤**: ✅ **친근한 톤** (이모지 최소화, 친구같은 조언)
2. **평수 옵션**: ✅ **20평, 30평 Chip 형태**로 제공 (MVP)
3. **시세 조회 지역**: ✅ **서울, 경기 우선 지원** (이후 확장 가능하나 현재는 논외)
4. **댓글 기능**: ✅ **본인 + 남편 2명** 각각 댓글 작성 가능 (2개 Supabase Auth 계정)
5. **알림 기능**: ⏸️ 우선순위 낮음 (v2 기능)
6. **다크모드**: ⏸️ 우선순위 낮음 (v2 기능)

---

## 기술 스택

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (optional)
- **State Management**: React Hooks + Context API
- **Form Handling**: React Hook Form + Zod validation

### Backend & Database

- **BaaS**: Supabase
  - PostgreSQL Database
  - Authentication (2개 계정 지원: 본인 + 남편)
  - Storage (사진 업로드)
  - Real-time subscriptions
  - Row Level Security (RLS)

### External APIs

- **주소/지역 검색**: 카카오 로컬 API
- **아파트 시세 조회**: 국토교통부 실거래가 공개시스템 API (서울, 경기)
- **AI 리포트 생성**: OpenAI API (GPT-4) - 친근한 톤

### Deployment

- **Platform**: Vercel
- **Environment**: Production, Preview

---

## 데이터베이스 스키마 (Supabase)

### 1. `users` 테이블

Supabase Auth 사용 (`auth.users`) - 2개 계정 생성 필요 (본인, 남편)

### 2. `records` 테이블 (임장 기록)

```sql
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 기본 정보
  type VARCHAR(20) NOT NULL CHECK (type IN ('대지', '아파트')),
  area_pyeong INTEGER NOT NULL CHECK (area_pyeong IN (20, 30)),
  price_in_hundred_million DECIMAL(10, 2) NOT NULL,

  -- 지역 정보 (서울, 경기)
  region_si VARCHAR(100) CHECK (region_si IN ('서울', '경기')),
  region_gu VARCHAR(100),
  region_dong VARCHAR(100),
  address_full TEXT,
  apartment_name VARCHAR(200),

  -- 평가
  school_accessibility INTEGER CHECK (school_accessibility BETWEEN 1 AND 5),
  traffic_accessibility TEXT,

  -- LTV
  is_ltv_regulated BOOLEAN DEFAULT false,
  ltv_rate INTEGER CHECK (ltv_rate IN (40, 70)),

  -- 메모 및 AI
  memo TEXT,
  ai_report TEXT,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_user_created (user_id, created_at DESC),
  INDEX idx_type_area (type, area_pyeong),
  INDEX idx_region (region_si, region_gu)
);
```

### 3. `record_photos` 테이블

```sql
CREATE TABLE record_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID REFERENCES records(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_record_order (record_id, photo_order)
);
```

### 4. `comments` 테이블

> [!NOTE] > **Multi-user 지원**: 본인과 남편 2명이 각각 댓글 작성 가능. Supabase Auth로 2개 계정 생성.

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID REFERENCES records(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_record_created (record_id, created_at DESC)
);
```

### 5. `search_history` 테이블

```sql
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  region_si VARCHAR(100),
  region_gu VARCHAR(100),
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_user_searched (user_id, searched_at DESC)
);
```

### 6. `loan_calculations` 테이블

```sql
CREATE TABLE loan_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_asset DECIMAL(15, 2) NOT NULL,
  apartment_price DECIMAL(15, 2) NOT NULL,
  ltv_rate INTEGER NOT NULL CHECK (ltv_rate IN (40, 70)),
  max_loan_amount DECIMAL(15, 2),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_user_calculated (user_id, calculated_at DESC)
);
```

### 7. `market_prices` 테이블 (시세 캐시)

```sql
CREATE TABLE market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_si VARCHAR(100) CHECK (region_si IN ('서울', '경기')),
  region_gu VARCHAR(100),
  apartment_name VARCHAR(200),
  transaction_date DATE,
  price_in_hundred_million DECIMAL(10, 2),
  area_pyeong INTEGER,
  floor INTEGER,

  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_region_date (region_si, region_gu, transaction_date DESC),
  UNIQUE (apartment_name, transaction_date, floor)
);
```

---

## API 엔드포인트 설계

### Next.js API Routes (`/app/api/`)

#### 1. `/api/records`

- `GET` - 임장 기록 목록 조회 (필터링, 페이지네이션)
- `POST` - 새 임장 기록 생성 + AI 리포트 자동 생성

#### 2. `/api/records/[id]`

- `GET` - 특정 기록 상세 조회
- `PATCH` - 기록 수정
- `DELETE` - 기록 삭제

#### 3. `/api/records/[id]/comments`

- `GET` - 댓글 목록
- `POST` - 댓글 추가 (본인/남편 구분)

#### 4. `/api/market-price`

- `GET` - 시세 조회 (서울, 경기만)
  - 쿼리: `si`, `gu`, `year`
  - 캐시 확인 → 외부 API → DB 저장

#### 5. `/api/loan/calculate`

- `POST` - 대출 계산
  - Body: `{ currentAsset, apartmentPrice, ltvRate }`

#### 6. `/api/search-history`

- `GET` - 최근 검색 이력 (10개)
- `POST` - 검색 이력 추가

#### 7. `/api/ai/generate-report`

- `POST` - AI 리포트 생성 (친근한 톤)

#### 8. `/api/upload`

- `POST` - 사진 업로드 (Supabase Storage)

---

## 외부 API 통합

### 1. 카카오 주소 검색 API

- **용도**: 주소 입력 → 법정동코드 변환
- **화면**: 임장 등록, 시세 조회
- **필요**: REST API Key
- **엔드포인트**: `https://dapi.kakao.com/v2/local/search/address.json`

### 2. 국토교통부 실거래가 API

- **용도**: 아파트 시세 조회
- **지역**: 서울, 경기만
- **필요**: 공공데이터 API 인증키, 법정동코드, 거래년월
- **엔드포인트**: `http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev`
- **주의**: XML 응답 → JSON 변환 필요 (xml2js)
- **캐싱**: 7일 유효

### 3. OpenAI API (친근한 톤)

- **용도**: AI 한줄 리포트 생성
- **톤**: 친근하고 편안한 말투, 이모지 최소화, 친구같은 조언
- **프롬프트 예시**:

```typescript
const prompt = `
다음 아파트 임장 정보를 분석하여 투자 가치를 친근하고 편안한 말투로 한 문장으로 요약해주세요.
이모지는 사용하지 말고, 마치 친구에게 조언하는 것처럼 자연스럽게 작성해주세요:

- 유형: ${recordData.type}
- 평수: ${recordData.area_pyeong}평
- 가격: ${recordData.price_in_hundred_million}억
- 초등학교 접근성: ${recordData.school_accessibility}/5
- 교통 접근성: ${recordData.traffic_accessibility}
- LTV 규제: ${recordData.is_ltv_regulated ? "규제지역" : "비규제"}
- 메모: ${recordData.memo}

예시: "학군도 좋고 교통도 편리해서 실거주하기 딱 좋을 것 같아요!"
`
```

---

## 화면별 상세 기능

### 1. 홈 (`/`)

- 최근 검색 이력: "성남시 중원구" 텍스트 표시
- 임장 기록 리스트
- FAB 버튼

### 2. 임장 등록 (`/records/new`)

- 임장유형: 대지/아파트 (radio)
- 평수: **20평/30평 Chip** (선택형)
- 가격 (억 단위)
- 학교 접근성 (별점 ★)
- 교통 접근성 (text)
- LTV 규제지역 (radio)
- 메모 (textarea)
- AI 리포트 (자동 생성 - 친근한 톤)
- 댓글 입력

### 3. 시세 조회 (`/market-price`)

- 지역 선택: **서울, 경기만**
- 년도: 202511 / 202411 / 202311
- 테이블: 날짜 | 아파트명 | 거래가(억)

### 4. 대출 계산기 (`/loan-calculator`)

- 현재 자산
- 아파트 금액
- LTV: 40% / 70% (radio toggle)
- 계산 결과

### 5. 상세보기 (`/records/[id]`)

- 사진 갤러리
- **AI 한줄 리포트** (친근한 톤)
- 상세 정보
- 댓글 (본인 + 남편)

### 6. 필터 검색 (`/records/filter`)

- 필터: 유형, 20/30평, 가격, LTV
- 필터링된 기록 리스트

---

## 프로젝트 구조

```
apartment-imjang-app/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── records/
│   │   ├── new/
│   │   ├── [id]/
│   │   └── filter/
│   ├── market-price/
│   ├── loan-calculator/
│   └── api/
├── components/
│   ├── ui/
│   ├── AreaChipSelector.tsx  # 20평/30평 Chip
│   ├── RecordForm.tsx
│   └── CommentSection.tsx
├── lib/
│   ├── supabase/
│   ├── apis/
│   │   ├── kakao.ts
│   │   ├── molit.ts
│   │   └── openai.ts  # 친근한 톤 프롬프트
│   └── utils/
└── types/
```

---

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
KAKAO_REST_API_KEY=
MOLIT_API_KEY=
OPENAI_API_KEY=
```

---

## 개발 시작 체크리스트

다른 개발자가 바로 시작할 수 있도록:

- [ ] Supabase 프로젝트 생성 및 DB 스키마 실행
- [ ] **2개 사용자 계정 생성** (본인, 남편)
- [ ] 카카오 REST API 키 발급
- [ ] 국토교통부 실거래가 API 인증키 발급
- [ ] OpenAI API 키 발급
- [ ] Next.js 프로젝트 초기화
- [ ] Vercel 배포 및 환경 변수 설정

---

## 마일스톤

### Phase 1: MVP (2주)

- [ ] 인증 (2개 계정)
- [ ] 임장 등록 (Chip 형태 평수 선택)
- [ ] AI 리포트 (친근한 톤)

### Phase 2: 핵심 기능 (2주)

- [ ] 시세 조회 (서울, 경기)
- [ ] 대출 계산기
- [ ] 댓글 (본인 + 남편)

### Phase 3: 고급 기능 (1주)

- [ ] 필터 검색
- [ ] 사진 업로드

### Phase 4: 배포 (1주)

- [ ] Vercel 배포
- [ ] 모바일 테스트

---

## 참고 자료

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [공공데이터포털](https://www.data.go.kr)
- [카카오 로컬 API](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
