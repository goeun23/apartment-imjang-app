import Link from "next/link"
import { Record, RecordPhoto } from "@/types"

interface RecordListProps {
  records: (Record & { record_photos: RecordPhoto[] })[]
  limit?: number
}

export default function RecordList({ records, limit }: RecordListProps) {
  const displayRecords = limit ? records.slice(0, limit) : records

  if (displayRecords.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg border border-gray-100">
        <p className="text-gray-500 mb-2">아직 기록이 없습니다</p>
        <Link
          href="/records/new"
          className="text-primary-600 font-medium hover:underline"
        >
          첫 기록 남기기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {displayRecords.map((record) => (
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
            <span>{new Date(record.created_at).toLocaleDateString()}</span>
            <span>상세보기 →</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

