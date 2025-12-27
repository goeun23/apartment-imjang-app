import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getRecords } from "@/lib/services/recordService.server"
import { getRecentSearches } from "@/lib/services/searchService.server"
import HomeHeader from "@/components/HomeHeader"
import RecentSearches from "@/components/RecentSearches"
import RecordList from "@/components/RecordList"

async function RecentSearchesSection() {
  const searches = await getRecentSearches()
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">최근 검색</h2>
      <RecentSearches searches={searches} />
    </section>
  )
}

async function RecordListSection() {
  const records = await getRecords()
  return (
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
      <RecordList records={records} limit={5} />
    </section>
  )
}

function RecordListSkeleton() {
  return (
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
      <div className="text-center py-8 text-gray-500">로딩 중...</div>
    </section>
  )
}

export default async function Home() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <HomeHeader />

      <div className="px-4 py-6 space-y-6">
        <Suspense fallback={<div className="text-sm text-gray-500">로딩 중...</div>}>
          <RecentSearchesSection />
        </Suspense>

        <Suspense fallback={<RecordListSkeleton />}>
          <RecordListSection />
        </Suspense>
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
