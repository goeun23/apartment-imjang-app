"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getMarketPrices } from "@/lib/services/marketPriceService"
import { MarketPrice } from "@/types"

const SEOUL_GU = ["강남구", "서초구", "송파구", "마포구", "용산구", "성동구"]
const GYEONGGI_GU = ["분당구", "수지구", "동안구", "영통구", "일산동구"]

export default function MarketPricePage() {
  const [selectedRegion, setSelectedRegion] = useState<"서울" | "경기">("서울")
  const [selectedGu, setSelectedGu] = useState(SEOUL_GU[0])
  const [selectedYear, setSelectedYear] = useState("202511")
  const [searchQuery, setSearchQuery] = useState("")

  const years = ["202511", "202411", "202311"]
  const guList = selectedRegion === "서울" ? SEOUL_GU : GYEONGGI_GU

  useEffect(() => {
    // Reset Gu when Region changes
    setSelectedGu(selectedRegion === "서울" ? SEOUL_GU[0] : GYEONGGI_GU[0])
  }, [selectedRegion])

  // React Query를 사용한 시세 조회
  const {
    data: marketPrices = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["market-price", selectedGu, selectedYear],
    queryFn: () => getMarketPrices(selectedGu, selectedYear),
    // 시세 데이터는 자주 변하지 않으므로 7일간 캐시 유지
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7일
    // 캐시는 30일간 유지
    gcTime: 1000 * 60 * 60 * 24 * 30, // 30일 (구 cacheTime)
    // 실패 시 2번 재시도
    retry: 2,
  })

  // 클라이언트 사이드 검색 (캐시된 데이터에서 필터링)
  const filteredPrices = searchQuery.trim()
    ? marketPrices.filter((item) =>
        item.apartment_name.includes(searchQuery)
      )
    : marketPrices

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary-600 text-white px-4 py-6">
        <h1 className="text-2xl font-bold">시세 조회</h1>
        <p className="text-primary-100 text-sm mt-1">
          실거래가 정보를 확인하세요
        </p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 지역 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            지역 선택
          </label>
          <div className="flex gap-3 mb-3">
            {(["서울", "경기"] as const).map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  selectedRegion === region
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-primary-500"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
          {/* Gu Selector */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2">
              {guList.map((gu) => (
                <button
                  key={gu}
                  onClick={() => setSelectedGu(gu)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedGu === gu
                      ? "bg-gray-800 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {gu}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 년도 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            조회 기간
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedYear === year
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-primary-500"
                }`}
              >
                {year.slice(0, 4)}.{year.slice(4)}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            아파트 검색
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아파트명을 입력하세요"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 시세 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    아파트명
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    거래가(억)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-12 text-center text-red-500"
                    >
                      시세 정보를 불러오는데 실패했습니다. 다시 시도해주세요.
                    </td>
                  </tr>
                ) : filteredPrices.length > 0 ? (
                  filteredPrices.map((item, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {item.transaction_date}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {item.apartment_name}
                        <span className="block text-xs text-gray-500 font-normal">
                          {item.area_pyeong}평 / {item.floor}층
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-right font-semibold text-primary-600">
                        {item.price_in_hundred_million}억
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      조회된 거래 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 정보 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 국토교통부 실거래가 공개시스템 데이터를 기반으로 합니다.
          </p>
        </div>
      </div>
    </main>
  )
}
