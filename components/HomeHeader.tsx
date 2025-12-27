"use client"

import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { LogOut } from "lucide-react"

export default function HomeHeader() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="bg-primary-600 text-white px-4 py-6 flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-bold">아파트 임장 기록</h1>
        <p className="text-primary-100 text-sm mt-1">
          부동산 투자를 위한 스마트한 기록
        </p>
      </div>
      <button
        onClick={handleLogout}
        className="p-2 hover:bg-primary-700 rounded-full transition-colors"
        aria-label="로그아웃"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  )
}

