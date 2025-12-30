# 푸시 알림 권한 문제 해결 가이드

## 🔍 권한 상태 확인 방법

### 1. 브라우저 콘솔에서 확인

개발자 도구 (F12) → Console 탭에서 다음을 입력:

```javascript
Notification.permission
```

결과:
- `"granted"` - 허용됨 ✅
- `"denied"` - 거부됨 ❌
- `"default"` - 아직 요청 안 함 ⏳

### 2. 개발 모드에서 확인

앱 하단 왼쪽에 표시되는 상태 표시기를 확인하세요:
- ✅ 구독됨 / ✅ 허용
- ❌ 미구독 / ❌ 거부
- ⏳ 대기중

## 🔧 권한이 "denied"로 나오는 경우

### 원인
1. 이전에 다른 사이트에서 알림을 거부했을 수 있음
2. 브라우저가 자동으로 거부했을 수 있음
3. 브라우저 설정에서 기본적으로 거부로 설정되어 있을 수 있음

### 해결 방법

#### Chrome/Edge
1. 주소창 왼쪽의 **자물쇠 아이콘** (또는 정보 아이콘) 클릭
2. **사이트 설정** 클릭
3. **알림** 섹션 찾기
4. **허용**으로 변경
5. 페이지 새로고침 (F5)

#### Firefox
1. 주소창 왼쪽의 **자물쇠 아이콘** 클릭
2. **권한** 섹션에서 **알림** 찾기
3. **허용**으로 변경
4. 페이지 새로고침

#### Safari (macOS)
1. Safari → 설정 → 웹사이트 → 알림
2. 해당 사이트 찾기
3. **허용**으로 변경

### 전체 브라우저 설정에서 확인

#### Chrome
1. 설정 → 개인정보 및 보안 → 사이트 설정 → 알림
2. `localhost:3000` 또는 해당 도메인 찾기
3. **허용**으로 변경

#### Edge
1. 설정 → 쿠키 및 사이트 권한 → 알림
2. 해당 사이트 찾아서 **허용**

## 🧪 권한 재설정 테스트

### 방법 1: 브라우저 콘솔에서 직접 확인

```javascript
// 현재 권한 확인
console.log('현재 권한:', Notification.permission)

// 권한 요청 (이미 denied면 작동 안 함)
Notification.requestPermission().then(permission => {
  console.log('권한 요청 결과:', permission)
})
```

### 방법 2: 시크릿 모드에서 테스트

1. 시크릿 창 열기 (Ctrl+Shift+N)
2. `localhost:3000` 접속
3. 권한 요청 팝업이 나타나는지 확인
4. **허용** 클릭

### 방법 3: 브라우저 데이터 초기화

**주의**: 이 방법은 해당 사이트의 모든 데이터를 삭제합니다.

1. 개발자 도구 (F12) → Application 탭
2. Storage → Clear site data 클릭
3. 페이지 새로고침

## 📱 모바일 브라우저

### Chrome (Android)
1. 메뉴 (⋮) → 설정 → 사이트 설정 → 알림
2. 해당 사이트 찾아서 **허용**

### Safari (iOS)
1. 설정 → Safari → 알림
2. 해당 사이트 찾아서 **허용**

## 🔄 권한 상태별 동작

### `"default"` (대기중)
- 앱이 자동으로 권한 요청 팝업 표시
- 사용자가 허용/거부 선택 가능

### `"granted"` (허용됨)
- 푸시 구독 자동 생성
- 서버에 구독 정보 저장
- 새 글 등록 시 알림 수신 가능

### `"denied"` (거부됨)
- 자동 권한 요청 불가
- 브라우저 설정에서 수동으로 허용 필요
- 콘솔에 안내 메시지 표시

## 💡 디버깅 팁

### Service Worker 확인
```javascript
// 개발자 도구 → Application → Service Workers
// sw.js가 등록되어 있고 "activated" 상태인지 확인
```

### 푸시 구독 확인
```javascript
// 개발자 도구 → Application → Storage → IndexedDB
// 또는 Supabase 대시보드 → push_subscriptions 테이블
```

### 네트워크 요청 확인
```javascript
// 개발자 도구 → Network 탭
// /api/push/subscribe 요청이 성공했는지 확인
```

## ❓ 여전히 작동하지 않는 경우

1. **VAPID 키 확인**
   - `.env.local`에 올바르게 설정되었는지 확인
   - 서버 재시작 (`npm run dev`)

2. **HTTPS 확인**
   - 프로덕션은 HTTPS 필수
   - 로컬은 `localhost`면 HTTP 가능

3. **브라우저 지원 확인**
   - Chrome, Edge, Firefox 지원
   - Safari는 macOS/iOS만 지원 (제한적)

4. **콘솔 에러 확인**
   - 개발자 도구 → Console에서 에러 메시지 확인
   - 에러 메시지를 복사해서 확인

---

**팁**: 개발 중에는 개발자 도구를 열어두고 Console 탭을 보면서 테스트하세요!

