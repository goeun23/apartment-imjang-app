# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Apartment Imjang Recording App** - A mobile-optimized web application for recording real estate property inspections (임장) with AI-powered analysis. Built for a family of 2 users to track apartment viewings, market prices, and loan calculations.

**Tech Stack:**
- Next.js 15 (App Router) + TypeScript
- Supabase (PostgreSQL, Auth, Storage)
- Tailwind CSS + shadcn/ui components
- React Hook Form + Zod validation

**Key Color:** Primary Blue (#3B82F6)

## Development Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Run ESLint
```

## Architecture Overview

### Data Model

The app uses Supabase with 6 main tables:

1. **records** - Core property inspection records
   - Constrained fields: `type` (대지/아파트), `area_pyeong` (20/30), `region_si` (서울/경기), `ltv_rate` (40/70)
   - Includes lat/lng for map display
   - All authenticated users can CRUD (family shared access)

2. **record_photos** - Photo attachments for records (max 10 per record, 5MB each)

3. **comments** - Multi-user comments (2 family members can comment separately)

4. **search_history** - Recent searches by region (last 10)

5. **loan_calculations** - LTV-based loan calculation history

6. **market_prices** - Cached market price data from government API (7-day cache)

**Schema location:** `supabase/schema.sql`

### Directory Structure

```
app/
├── (auth)/login/              # Auth pages
├── records/                   # Main CRUD pages
│   ├── new/                   # Create new record
│   ├── [id]/                  # Record detail view
│   ├── [id]/edit/             # Edit record
│   └── filter/                # Filter/search records
├── market-price/              # Market price lookup (Seoul/Gyeonggi)
├── loan-calculator/           # LTV loan calculator
└── api/
    └── market-price/          # API route for price data

components/
├── layout/BottomNav.tsx       # Fixed bottom navigation (4 tabs)
├── records/                   # Record-specific components
│   ├── RecordCard.tsx
│   ├── RecordBasicInfo.tsx
│   ├── RecordMap.tsx          # Kakao Map integration
│   ├── RecordAIReport.tsx
│   ├── RecordComments.tsx
│   └── RecordImages.tsx
├── features/
│   ├── AddressSearch.tsx      # Kakao address search
│   └── MoneyRange.tsx
├── ui/                        # shadcn components
├── AreaChipSelector.tsx       # 20평/30평 chip selector
├── StarRating.tsx             # 1-5 star rating
└── PhotoUploader.tsx          # Multi-image upload

lib/
├── supabase/                  # Supabase client setup
│   ├── client.ts
│   ├── server.ts
│   └── storage.ts
├── services/                  # Data access layer
│   ├── recordService.ts
│   ├── searchService.ts
│   ├── loanService.ts
│   └── marketPriceService.ts
└── apis/
    └── kakao.ts               # Kakao geocoding API

types/index.ts                 # TypeScript type definitions
middleware.ts                  # Auth middleware (redirects to /login if not authenticated)
```

### Authentication Flow

- Uses Supabase Auth with email/password
- Middleware protects all routes except `/login` and `/auth/callback`
- Two user accounts: one for each family member
- Session state managed via `@supabase/auth-helpers-nextjs`

### Data Access Patterns

**Client Components:**
- Use `createClientComponentClient()` from `@supabase/auth-helpers-nextjs`
- Import service functions from `lib/services/` (e.g., `getRecords()`, `createRecord()`)
- Services handle auth session internally

**Server Components/API Routes:**
- Use `createServerComponentClient()` or `createRouteHandlerClient()`
- Located in `lib/supabase/server.ts`

### External API Integrations

1. **Kakao Local API** (Geocoding)
   - Used in: `lib/apis/kakao.ts`, address search components
   - Converts addresses to lat/lng for map display
   - Env: `NEXT_PUBLIC_KAKAO_REST_API_KEY`

2. **국토교통부 실거래가 API** (Government Real Estate Transactions)
   - Used in: Market price lookup page
   - Returns XML → needs parsing to JSON
   - Limited to Seoul (서울) and Gyeonggi (경기) regions
   - Env: `MOLIT_API_KEY`
   - Cache results in `market_prices` table for 7 days

3. **OpenAI API** (AI Report Generation)
   - Generates friendly single-sentence property analysis
   - Tone: Friendly, conversational, minimal emojis (친근한 톤)
   - Triggered when creating/editing records
   - Env: `OPENAI_API_KEY`

### UI/UX Patterns

**Mobile-First Design:**
- Fixed bottom navigation (`components/layout/BottomNav.tsx`)
- FAB (Floating Action Button) on main pages for quick record creation
- All pages designed for mobile viewport

**Form Handling:**
- React Hook Form + Zod validation
- Chip-based selection for constrained choices (e.g., 20평/30평)
- Star rating for accessibility scores (1-5)

**Image Handling:**
- Multi-upload with preview via `PhotoUploader.tsx`
- Max 10 images per record, 5MB each
- Stored in Supabase Storage bucket `record-photos`

**Shared State:**
- Two family members share all records (no isolation)
- Comments are user-specific to identify who wrote what

## Important Constraints

### Fixed Options (DO NOT add more without user approval)

- **Property Type:** Only "대지" or "아파트"
- **Area:** Only 20평 or 30평
- **Regions:** Only "서울" or "경기"
- **LTV Rates:** Only 40% or 70%

### Validation Rules

- School accessibility: 1-5 stars
- Price: Numeric in units of 억 (hundred million KRW)
- Photo limit: 10 images, 5MB each
- Search history: Keep last 10 only

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_KAKAO_REST_API_KEY=  # For geocoding
MOLIT_API_KEY=                   # Government real estate API
OPENAI_API_KEY=                  # For AI report generation
```

## Working with This Codebase

### When Adding Features

1. Check if it violates fixed constraints (areas, regions, types)
2. Update type definitions in `types/index.ts` if needed
3. Add service functions in `lib/services/` before UI
4. Follow mobile-first design patterns
5. Maintain blue color scheme (`primary-*` Tailwind classes)

### When Modifying Database

1. Write migration SQL in `supabase/migrations/`
2. Update TypeScript types in `types/index.ts`
3. Update service layer in `lib/services/`
4. Verify RLS policies allow family sharing

### When Working with External APIs

- Kakao API: Always handle null responses gracefully (API may fail)
- Government API: Cache results in DB, XML parsing required
- OpenAI API: Include friendly tone prompt, avoid excessive emojis

### Testing Locally

- Requires Supabase project with schema.sql applied
- Two test accounts needed in Supabase Auth
- Storage bucket `record-photos` must be created with public read policy
- API keys for Kakao, MOLIT, and OpenAI required for full functionality

## Known Limitations

- No dark mode (v2 feature)
- No push notifications (v2 feature)
- Seoul/Gyeonggi regions only (may expand later)
- 20평/30평 only (may expand later)
- Desktop experience is functional but not optimized
