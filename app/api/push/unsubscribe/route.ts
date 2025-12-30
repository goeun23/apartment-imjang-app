import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * 푸시 구독 정보를 Supabase에서 삭제하는 API
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

    const { endpoint } = await request.json()

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint가 필요합니다.' }, { status: 400 })
    }

    // 구독 삭제
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', session.user.id)
      .eq('endpoint', endpoint)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('푸시 구독 삭제 실패:', error)
    return NextResponse.json(
      { error: error.message || '구독 정보 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}

