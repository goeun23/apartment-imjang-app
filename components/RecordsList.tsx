"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { Record, RecordPhoto } from "@/types"
import { fetchRecordsAction } from "@/lib/actions/record"

interface RecordsListProps {
  records: (Record & { record_photos: RecordPhoto[] })[]
}

export default function RecordsList({ records: initialRecords }: RecordsListProps) {
  const { ref, inView } = useInView()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ["records"],
    queryFn: async ({ pageParam = 1 }) => {
      return await fetchRecordsAction({ page: pageParam, limit: 10 })
    },
    initialPageParam: 2,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length + 1 : undefined
    },
    initialData: {
      pages: [initialRecords],
      pageParams: [1]
    }
  })

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  const allRecords = data ? data.pages.flat() : initialRecords

  if (allRecords.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">아직 등록된 임장 기록이 없습니다</p>
        <Link
          href="/records/new"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          첫 기록 등록하기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {allRecords.map((record) => (
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
              {new Date(record.created_at).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}

      {/* Loading trigger */}
      <div ref={ref} className="py-4 text-center">
        {isFetchingNextPage ? (
          <div className="text-gray-500 text-sm">더 불러오는 중...</div>
        ) : hasNextPage ? (
          <div className="h-4" />
        ) : (
          <div className="text-gray-400 text-sm">모든 기록을 불러왔습니다</div>
        )}
      </div>
    </div>
  )
}

