import { Suspense } from "react"
import Link from "next/link"
import { fetchRecordsAction } from "@/lib/actions/record"
import RecordsList from "@/components/RecordsList"

export const metadata = {
  title: "임장 기록 목록",
  description: "등록된 아파트 임장 기록을 확인하세요",
  openGraph: {
    title: "임장 기록 목록 - 아파트 임장 기록",
    description: "등록된 아파트 임장 기록을 확인하세요",
    type: "website",
  },
}

async function RecordsListSection() {
  const records = await fetchRecordsAction({ page: 1, limit: 10 })
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
  return (
    <div className="bg-primary-600 text-white px-4 py-6">
      <h1 className="text-2xl font-bold">임장 기록</h1>
      <p className="text-primary-100 text-sm mt-1">등록된 임장 기록 목록입니다</p>
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
