import { SearchHistory } from "@/types"

interface RecentSearchesProps {
  searches: SearchHistory[]
}

export default function RecentSearches({ searches }: RecentSearchesProps) {
  if (searches.length === 0) {
    return <p className="text-sm text-gray-500">최근 검색 내역이 없습니다.</p>
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {searches.map((search) => (
        <button
          key={search.id}
          className="px-4 py-2 bg-white rounded-full border border-gray-200 text-sm text-gray-700 whitespace-nowrap hover:border-primary-500 hover:text-primary-600 transition-colors"
        >
          {search.region_si} {search.region_gu}
        </button>
      ))}
    </div>
  )
}

