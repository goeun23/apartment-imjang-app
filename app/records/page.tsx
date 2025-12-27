import { Suspense } from "react"
import Link from "next/link"
import { getRecords } from "@/lib/services/recordService.server"
import RecordsList from "@/components/RecordsList"

async function RecordsListSection() {
  const records = await getRecords()
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <Link
          href="/records/filter"
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-primary-500 hover:text-primary-600 transition-colors"
        >
          🔍 필터 검색
        </Link>
        <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option>최신순</option>
          <option>가격 높은순</option>
          <option>가격 낮은순</option>
        </select>
      </div>
      <RecordsList records={records} />
    </>
  )
}

async function RecordsHeader() {
  const records = await getRecords()
  return (
    <div className="bg-primary-600 text-white px-4 py-6">
      <h1 className="text-2xl font-bold">임장 기록</h1>
      <p className="text-primary-100 text-sm mt-1">총 {records.length}개의 기록</p>
    </div>
  )
}

function RecordsListSkeleton() {
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div className="px-4 py-2 bg-gray-200 rounded-lg animate-pulse w-24 h-9"></div>
        <div className="px-4 py-2 bg-gray-200 rounded-lg animate-pulse w-32 h-9"></div>
      </div>
      <div className="text-center py-12 text-gray-500">로딩 중...</div>
    </>
  )
}

export default async function RecordsPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <Suspense
        fallback={
          <div className="bg-primary-600 text-white px-4 py-6">
            <h1 className="text-2xl font-bold">임장 기록</h1>
            <p className="text-primary-100 text-sm mt-1">기록을 불러오는 중...</p>
          </div>
        }
      >
        <RecordsHeader />
      </Suspense>

      <div className="px-4 py-6">
        <Suspense fallback={<RecordsListSkeleton />}>
          <RecordsListSection />
        </Suspense>
      </div>

      {/* Floating Action Button */}
      <Link
        href="/records/new"
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-primary-700 transition-colors z-40"
      >
        +
      </Link>
    </main>
  )
}
