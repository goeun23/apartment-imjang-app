import MarketPriceDashboard from "@/components/features/MarketPriceDashboard"

export const metadata = {
  title: "시세 조회 - 아파트 임장 기록",
  description: "국토교통부 실거래가 정보를 확인하세요",
}

export default function MarketPricePage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary-600 text-white px-4 py-6">
        <h1 className="text-2xl font-bold">시세 조회</h1>
        <p className="text-primary-100 text-sm mt-1">
          실거래가 정보를 확인하세요
        </p>
      </div>

      <div className="px-4 py-6">
        <MarketPriceDashboard />
      </div>
    </main>
  )
}
