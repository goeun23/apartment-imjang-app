"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { getFilteredRecords, FilterOptions } from "@/lib/services/recordService"
import { Record, RecordPhoto } from "@/types"

interface FilterState {
  type: string[]
  area_pyeong: number[]
  priceMin: string
  priceMax: string
  is_ltv_regulated: string
  school_accessibility_min: number
}

export default function FilterPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<FilterState>({
    type: [],
    area_pyeong: [],
    priceMin: "",
    priceMax: "",
    is_ltv_regulated: "all",
    school_accessibility_min: 0,
  })

  // 필터 옵션을 React Query가 사용할 수 있는 형태로 변환
  const filterOptions: FilterOptions = useMemo(() => {
    const options: FilterOptions = {}

    if (filters.type.length > 0) {
      options.type = filters.type
    }

    if (filters.area_pyeong.length > 0) {
      options.area_pyeong = filters.area_pyeong
    }

    if (filters.priceMin) {
      options.priceMin = parseFloat(filters.priceMin)
    }

    if (filters.priceMax) {
      options.priceMax = parseFloat(filters.priceMax)
    }

    if (filters.is_ltv_regulated !== "all") {
      options.is_ltv_regulated = filters.is_ltv_regulated === "true"
    }

    if (filters.school_accessibility_min > 0) {
      options.school_accessibility_min = filters.school_accessibility_min
    }

    return options
  }, [filters])

  // React Query를 사용한 필터 검색
  const {
    data: results = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["records", "filtered", filterOptions],
    queryFn: () => getFilteredRecords(filterOptions),
    // 필터가 하나도 없으면 쿼리를 실행하지 않음
    enabled: Object.keys(filterOptions).length > 0,
    // 필터 결과는 5분간 캐시 유지 (사용자가 필터를 변경했다가 다시 돌아올 때 빠르게 표시)
    staleTime: 1000 * 60 * 5,
  })

  const toggleArrayFilter = (key: keyof FilterState, value: any) => {
    const currentArray = filters[key] as any[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value]
    setFilters({ ...filters, [key]: newArray })
  }

  const resetFilters = () => {
    setFilters({
      type: [],
      area_pyeong: [],
      priceMin: "",
      priceMax: "",
      is_ltv_regulated: "all",
      school_accessibility_min: 0,
    })
  }

  // 필터 적용은 React Query가 자동으로 처리하므로 별도 함수 불필요
  // 필터 상태가 변경되면 자동으로 재요청됨

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mr-3"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">필터 검색</h1>
          </div>
          <button
            onClick={resetFilters}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 임장 유형 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            임장 유형
          </label>
          <div className="flex gap-3">
            {["대지", "아파트"].map((type) => (
              <button
                key={type}
                onClick={() => toggleArrayFilter("type", type)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  filters.type.includes(type)
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-primary-500"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 평수 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            평수
          </label>
          <div className="flex gap-3">
            {[20, 30].map((pyeong) => (
              <button
                key={pyeong}
                onClick={() => toggleArrayFilter("area_pyeong", pyeong)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  filters.area_pyeong.includes(pyeong)
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-primary-500"
                }`}
              >
                {pyeong}평
              </button>
            ))}
          </div>
        </div>

        {/* 가격 범위 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            가격 범위 (억)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="0.1"
              value={filters.priceMin}
              onChange={(e) =>
                setFilters({ ...filters, priceMin: e.target.value })
              }
              placeholder="최소"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="text-gray-500">~</span>
            <input
              type="number"
              step="0.1"
              value={filters.priceMax}
              onChange={(e) =>
                setFilters({ ...filters, priceMax: e.target.value })
              }
              placeholder="최대"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* LTV 규제 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            LTV 규제지역
          </label>
          <div className="flex gap-3">
            {[
              { value: "all", label: "전체" },
              { value: "true", label: "규제지역" },
              { value: "false", label: "비규제" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setFilters({ ...filters, is_ltv_regulated: option.value })
                }
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  filters.is_ltv_regulated === option.value
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-primary-500"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 학교 접근성 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            학교 접근성 (최소)
          </label>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() =>
                  setFilters({ ...filters, school_accessibility_min: rating })
                }
                className={`flex-1 py-3 px-2 rounded-lg font-medium transition-all ${
                  filters.school_accessibility_min === rating
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-primary-500"
                }`}
              >
                {rating === 0 ? "전체" : `${rating}+`}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            검색 결과 ({isLoading ? "..." : results.length})
          </h3>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              필터링 중...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              오류가 발생했습니다. 다시 시도해주세요.
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              조건에 맞는 기록이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((record: Record & { record_photos: RecordPhoto[] }) => (
              <Link
                key={record.id}
                href={`/records/${record.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-md font-medium">
                        {record.type}
                      </span>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {record.area_pyeong}평
                      </span>
                      {record.is_ltv_regulated && (
                        <span className="inline-block px-2 py-1 bg-red-50 text-red-600 text-xs rounded-md">
                          LTV규제
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {record.apartment_name || "이름 없음"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {record.region_si} {record.region_gu}
                      {record.region_dong && ` ${record.region_dong}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-600">
                      {record.price_in_hundred_million}억
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span>학교 접근성:</span>
                    <span className="text-yellow-500">
                      {"★".repeat(record.school_accessibility)}
                      {"☆".repeat(5 - record.school_accessibility)}
                    </span>
                  </div>
                    <span className="text-xs text-gray-400">
                    {new Date(record.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
