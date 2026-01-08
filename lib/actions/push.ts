'use server'

import webpush from 'web-push'
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface PushPayload {
  title: string
  body: string
  url: string
}

export async function sendPushNotification(payload: PushPayload) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    // Auth check
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    if (!session) {
      return { success: false, error: 'Authorization required' }
    }

    const { title, body, url } = payload

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:your-email@example.com'

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not set')
      return { success: false, error: 'Server configuration error' }
    }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh_key, auth_key')

    if (error) throw error

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, message: 'No subscriptions' }
    }

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
            title: title || 'New Record',
            body: body || 'Check out the new record',
            url: url || '/',
          })
        )
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
        console.error(`Push failed for ${sub.endpoint}:`, error)
      }
    })

    await Promise.allSettled(pushPromises)

    return { 
      success: true, 
      sentCount: subscriptions.length 
    }
  } catch (error: any) {
    console.error('Push notification failed:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}
