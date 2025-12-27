import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const createClient = async () => {
  return createServerComponentClient({ cookies: await cookies() })
}
