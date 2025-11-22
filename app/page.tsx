"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getRecords } from "@/lib/services/recordService"
import { getRecentSearches } from "@/lib/services/searchService"
import { Record, RecordPhoto, SearchHistory } from "@/types"
import { Plus, LogOut } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [recentRecords, setRecentRecords] = useState<
    (Record & { record_photos: RecordPhoto[] })[]
  >([])
  const [recentSearches, setRecentSearches] = useState<SearchHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recordsData, searchesData] = await Promise.all([
          getRecords(),
          getRecentSearches(),
        ])
        setRecentRecords(recordsData.slice(0, 5))
        setRecentSearches(searchesData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
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

      <div className="px-4 py-6 space-y-6">
        {/* 최근 검색 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            최근 검색
          </h2>
          {recentSearches.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentSearches.map((search) => (
                <button
                  key={search.id}
                  className="px-4 py-2 bg-white rounded-full border border-gray-200 text-sm text-gray-700 whitespace-nowrap hover:border-primary-500 hover:text-primary-600 transition-colors"
                >
                  {search.region_si} {search.region_gu}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">최근 검색 내역이 없습니다.</p>
          )}
        </section>

        {/* 임장 기록 */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">임장 기록</h2>
            <Link
              href="/records"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              전체보기 →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : recentRecords.length > 0 ? (
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <Link
                  key={record.id}
                  href={`/records/${record.id}`}
                  className="block bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-md font-medium mb-2">
                        {record.type}
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {record.apartment_name || "이름 없음"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {record.region_si} {record.region_gu}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">
                        {record.price_in_hundred_million}억
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {record.area_pyeong}평
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                    <span>
                      {new Date(record.created_at).toLocaleDateString()}
                    </span>
                    <span>상세보기 →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-100">
              <p className="text-gray-500 mb-2">아직 기록이 없습니다</p>
              <Link
                href="/records/new"
                className="text-primary-600 font-medium hover:underline"
              >
                첫 기록 남기기
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Floating Action Button */}
      <Link
        href="/records/new"
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-primary-700 transition-colors z-40"
      >
        <Plus className="w-8 h-8" />
      </Link>
    </main>
  )
}
