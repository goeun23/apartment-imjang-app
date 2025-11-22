import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 로그인 페이지가 아니고 세션이 없으면 로그인 페이지로 리다이렉트
  if (!session && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // 로그인 상태에서 로그인 페이지 접근 시 홈으로 리다이렉트
  if (session && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|auth).*)"],
}
