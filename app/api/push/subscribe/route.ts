import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * 푸시 구독 정보를 Supabase에 저장하는 API
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

    const { subscription } = await request.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: '구독 정보가 올바르지 않습니다.' }, { status: 400 })
    }

    // 기존 구독 확인
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('endpoint', subscription.endpoint)
      .single()

    if (existingSubscription) {
      // 이미 존재하면 업데이트
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id)

      if (error) throw error
    } else {
      // 새로 생성
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: session.user.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
      })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('푸시 구독 저장 실패:', error)
    return NextResponse.json(
      { error: error.message || '구독 정보 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}

