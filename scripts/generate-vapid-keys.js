/**
 * VAPID 키 생성 스크립트
 * 
 * 사용법:
 * node scripts/generate-vapid-keys.js
 * 
 * 생성된 키를 .env.local 파일에 추가하세요:
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY=생성된_공개키
 * VAPID_PRIVATE_KEY=생성된_비공개키
 * VAPID_EMAIL=mailto:your-email@example.com
 */

const webpush = require('web-push')

// VAPID 키 생성
const vapidKeys = webpush.generateVAPIDKeys()

console.log('='.repeat(60))
console.log('VAPID 키가 생성되었습니다!')
console.log('='.repeat(60))
console.log('\n공개 키 (Public Key):')
console.log(vapidKeys.publicKey)
console.log('\n비공개 키 (Private Key):')
console.log(vapidKeys.privateKey)
console.log('\n' + '='.repeat(60))
console.log('\n.env.local 파일에 다음을 추가하세요:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`VAPID_EMAIL=mailto:your-email@example.com`)
console.log('\n' + '='.repeat(60))

