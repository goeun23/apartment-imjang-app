import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

/**
 * 푸시 알림 전송 API
 * 새 글 등록 시 호출됩니다.
 */
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 인증 확인
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { title, body, url } = await request.json()

    // VAPID 키 설정 확인
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:your-email@example.com'

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID 키가 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '푸시 알림 설정이 완료되지 않았습니다.' },
        { status: 500 }
      )
    }

    // VAPID 키 설정
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

    // 모든 사용자의 푸시 구독 정보 가져오기
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh_key, auth_key')

    if (error) throw error

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: '구독자가 없습니다.' 
      })
    }

    // 모든 구독자에게 푸시 알림 전송
    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key,
            },
          },
          JSON.stringify({
            title: title || '새 임장 기록이 등록되었습니다',
            body: body || '임장 기록을 확인해보세요',
            url: url || '/',
          })
        )
      } catch (error: any) {
        // 구독이 만료되었거나 유효하지 않은 경우 삭제
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
        console.error(`푸시 전송 실패 (${sub.endpoint}):`, error)
      }
    })

    await Promise.allSettled(pushPromises)

    return NextResponse.json({ 
      success: true, 
      sent: subscriptions.length 
    })
  } catch (error: any) {
    console.error('푸시 알림 전송 실패:', error)
    return NextResponse.json(
      { error: error.message || '푸시 알림 전송에 실패했습니다.' },
      { status: 500 }
    )
  }
}

