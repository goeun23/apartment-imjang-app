import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">기록을 찾을 수 없습니다</h1>
        <p className="text-gray-500 mb-6">요청하신 임장 기록이 존재하지 않습니다.</p>
        <Link
          href="/records"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          기록 목록으로 돌아가기
        </Link>
      </div>
    </main>
  )
}

