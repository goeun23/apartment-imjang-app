# 웹 푸시 알림 테스트 가이드

로컬 환경에서 웹 푸시 알림을 테스트하는 방법입니다.

## 🚀 빠른 시작 (5단계)

### 1단계: VAPID 키 생성

```bash
node scripts/generate-vapid-keys.js
```

출력된 키를 복사하세요.

### 2단계: 환경 변수 설정

`.env.local` 파일을 열고 (없으면 생성) 다음을 추가:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=여기에_공개키_붙여넣기
VAPID_PRIVATE_KEY=여기에_비공개키_붙여넣기
VAPID_EMAIL=mailto:your-email@example.com
```

### 3단계: Supabase 테이블 생성

Supabase 대시보드 → SQL Editor에서:

```sql
-- supabase/migrations/create_push_subscriptions.sql 파일 내용 복사해서 실행
```

또는 파일 내용을 직접 복사해서 실행하세요.

### 4단계: 개발 서버 실행

```bash
npm run dev
```

### 5단계: 브라우저에서 테스트

1. **브라우저에서 `http://localhost:3000` 접속**
   - Chrome 또는 Edge 권장

2. **푸시 알림 권한 허용**
   - 브라우저가 알림 권한을 요청하면 "허용" 클릭
   - 개발자 도구 (F12) → Console에서 "Service Worker 등록 성공" 메시지 확인

3. **새 글 등록**
   - `/records/new` 페이지로 이동
   - 임장 기록 작성 후 저장

4. **알림 확인**
   - 같은 브라우저의 다른 탭에서 알림이 표시되는지 확인
   - 또는 다른 브라우저/기기에서도 알림이 오는지 확인

## 🔍 디버깅 방법

### Service Worker 확인

1. 개발자 도구 (F12) 열기
2. **Application** 탭 → **Service Workers**
3. `sw.js`가 등록되어 있는지 확인
4. 상태가 "activated"인지 확인

### 푸시 구독 확인

1. 개발자 도구 → **Application** 탭 → **Storage** → **IndexedDB**
2. 또는 Supabase 대시보드 → Table Editor → `push_subscriptions` 테이블 확인
3. 구독 정보가 저장되어 있는지 확인

### 콘솔 로그 확인

브라우저 콘솔에서 다음 메시지들을 확인:

- ✅ "Service Worker 등록 성공"
- ✅ "푸시 구독 성공"
- ✅ "구독 정보 저장 성공"

에러가 있다면 콘솔에 표시됩니다.

### 네트워크 요청 확인

1. 개발자 도구 → **Network** 탭
2. 새 글 저장 시 `/api/push/send` 요청이 있는지 확인
3. 응답 상태가 200인지 확인

## 🧪 실제 테스트 시나리오

### 시나리오 1: 같은 브라우저, 다른 탭

1. Chrome에서 `localhost:3000` 열기 (탭 1)
2. 권한 허용
3. 같은 Chrome에서 새 탭 열기 (탭 2)
4. 탭 1에서 새 글 등록
5. 탭 2에서 알림 확인 ✅

### 시나리오 2: 다른 브라우저

1. Chrome에서 `localhost:3000` 열고 권한 허용
2. Edge에서 `localhost:3000` 열고 권한 허용
3. Chrome에서 새 글 등록
4. Edge에서 알림 확인 ✅

### 시나리오 3: 모바일 브라우저 (같은 네트워크)

1. PC에서 `npm run dev` 실행
2. 모바일에서 `http://[PC의_IP주소]:3000` 접속
   - 예: `http://192.168.0.10:3000`
3. 권한 허용
4. PC에서 새 글 등록
5. 모바일에서 알림 확인 ✅

## ⚠️ 주의사항

1. **localhost는 HTTP에서도 작동합니다**
   - 프로덕션은 HTTPS 필수
   - 로컬은 `localhost` 또는 `127.0.0.1`이면 HTTP 가능

2. **브라우저별 차이**
   - Chrome, Edge: 완전 지원 ✅
   - Firefox: 지원 ✅
   - Safari: macOS/iOS만 지원 (제한적)

3. **권한 거부 시**
   - 브라우저 설정에서 알림 권한을 수동으로 허용해야 함
   - Chrome: 설정 → 개인정보 및 보안 → 사이트 설정 → 알림

## 🐛 문제 해결

### "Service Worker 등록 실패"
- `public/sw.js` 파일이 존재하는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### "VAPID 키가 설정되지 않았습니다"
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 서버를 재시작했는지 확인 (`npm run dev` 재실행)

### "구독 정보 저장 실패"
- Supabase 테이블이 생성되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인
- 로그인 상태인지 확인

### "푸시 알림이 오지 않음"
- 브라우저 알림 권한이 "허용"인지 확인
- Service Worker가 활성화되어 있는지 확인
- `/api/push/send` API가 성공적으로 호출되었는지 확인 (Network 탭)

## 📱 프로덕션 테스트 (선택사항)

로컬 테스트가 성공했다면 Vercel에 배포해서 실제 HTTPS 환경에서도 테스트할 수 있습니다:

1. Vercel에 배포
2. Vercel 대시보드 → Settings → Environment Variables에 VAPID 키 추가
3. 배포된 URL에서 테스트

---

**팁**: 개발 중에는 개발자 도구를 열어두고 Console 탭을 보면서 테스트하세요!

