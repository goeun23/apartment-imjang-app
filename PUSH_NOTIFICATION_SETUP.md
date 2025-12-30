# 웹 푸시 알림 설정 가이드

이 문서는 웹 푸시 알림 기능을 설정하는 방법을 안내합니다.

## 📋 목차

1. [VAPID 키 생성](#1-vapid-키-생성)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [Supabase 테이블 생성](#3-supabase-테이블-생성)
4. [테스트 방법](#4-테스트-방법)

## 1. VAPID 키 생성

웹 푸시 알림을 사용하려면 VAPID (Voluntary Application Server Identification) 키가 필요합니다.

### 방법 1: 스크립트 사용 (권장)

```bash
node scripts/generate-vapid-keys.js
```

스크립트가 공개 키와 비공개 키를 생성합니다.

### 방법 2: 수동 생성

Node.js REPL에서 직접 생성할 수도 있습니다:

```bash
node
> const webpush = require('web-push')
> const vapidKeys = webpush.generateVAPIDKeys()
> console.log('Public Key:', vapidKeys.publicKey)
> console.log('Private Key:', vapidKeys.privateKey)
```

## 2. 환경 변수 설정

생성된 VAPID 키를 `.env.local` 파일에 추가하세요:

```env
# VAPID 키 (웹 푸시 알림용)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=생성된_공개키
VAPID_PRIVATE_KEY=생성된_비공개키
VAPID_EMAIL=mailto:your-email@example.com
```

**중요:**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`는 클라이언트에서 사용되므로 `NEXT_PUBLIC_` 접두사가 필요합니다.
- `VAPID_PRIVATE_KEY`는 서버에서만 사용되므로 접두사 없이 설정합니다.
- `VAPID_EMAIL`은 `mailto:` 형식으로 입력해야 합니다.

## 3. Supabase 테이블 생성

Supabase 대시보드에서 SQL Editor를 열고 다음 마이그레이션 파일을 실행하세요:

```sql
-- supabase/migrations/create_push_subscriptions.sql 파일의 내용을 실행
```

또는 Supabase CLI를 사용하는 경우:

```bash
supabase db push
```

## 4. 테스트 방법

### 4.1 로컬 개발 환경

1. 개발 서버 실행:
   ```bash
   npm run dev
   ```

2. 브라우저에서 앱 접속 (HTTPS 또는 localhost)

3. 브라우저가 푸시 알림 권한을 요청하면 "허용" 클릭

4. 새 글 등록 페이지에서 글 작성 후 저장

5. 다른 탭이나 다른 브라우저에서 알림이 표시되는지 확인

### 4.2 프로덕션 환경

프로덕션 환경에서는 HTTPS가 필수입니다. Vercel 등에 배포할 때:

1. 환경 변수 설정:
   - Vercel 대시보드 → Settings → Environment Variables
   - 위에서 생성한 VAPID 키들을 추가

2. 배포 후 테스트:
   - 실제 도메인에서 앱 접속
   - 푸시 알림 권한 허용
   - 새 글 등록 후 알림 확인

## 🔧 문제 해결

### 푸시 알림이 작동하지 않는 경우

1. **브라우저 지원 확인**
   - Chrome, Edge, Firefox, Safari (macOS/iOS) 지원
   - HTTPS 또는 localhost에서만 작동

2. **권한 확인**
   - 브라우저 설정에서 알림 권한이 "허용"인지 확인
   - 개발자 도구 → Application → Notifications에서 확인

3. **Service Worker 확인**
   - 개발자 도구 → Application → Service Workers
   - Service Worker가 등록되어 있는지 확인

4. **VAPID 키 확인**
   - 환경 변수가 올바르게 설정되었는지 확인
   - 공개 키와 비공개 키가 올바른지 확인

5. **Supabase 테이블 확인**
   - `push_subscriptions` 테이블이 생성되었는지 확인
   - 구독 정보가 저장되었는지 확인

## 📚 참고 자료

- [Web Push Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push 라이브러리 문서](https://github.com/web-push-libs/web-push)
- [VAPID 설명](https://blog.mozilla.org/services/2016/04/04/using-vapid-with-webpush/)

## 💡 포트폴리오 활용 팁

이 기능은 다음과 같이 포트폴리오에 강조할 수 있습니다:

- **실시간 알림 시스템 구현**: Service Worker와 Web Push API를 활용한 실시간 알림 시스템
- **사용자 경험 개선**: 사용자가 앱을 열지 않아도 새 콘텐츠를 알림으로 받을 수 있음
- **프로덕션 레벨 구현**: VAPID 인증, 구독 관리, 에러 핸들링 등 실무 수준의 구현

