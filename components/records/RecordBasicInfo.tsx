import { Record } from '@/types'

export default function BasicInfo({ record }: { record: Record }) {
	return (
		<div className="bg-white  p-4 shadow-sm border border-gray-200">
			<div className="flex items-start justify-between mb-4">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-md font-medium">
							{record.type}
						</span>
						<span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
							{record.area_pyeong}평
						</span>
						{record.is_ltv_regulated && (
							<span className="inline-block px-2 py-1 bg-red-50 text-red-600 text-xs rounded-md">
								LTV규제 {record.ltv_rate}%
							</span>
						)}
					</div>
					<h2 className="text-2xl font-bold text-gray-900">
						{record.apartment_name || '이름 없음'}
					</h2>
					<p className="text-gray-600 mt-1">
						{record.region_si} {record.region_gu} {record.region_dong} {record.address_full}
					</p>
				</div>
				<div className="text-right">
					<p className="text-3xl font-bold text-primary-600">{record.price_in_hundred_million}억</p>
				</div>
			</div>

			<div className="space-y-3 pt-4 border-t border-gray-200">
				<div className="flex items-center justify-between">
					<span className="text-gray-600">초등학교 접근성</span>
					<span className="text-yellow-500 text-lg">
						{'★'.repeat(record.school_accessibility)}
						{'☆'.repeat(5 - record.school_accessibility)}
					</span>
				</div>
				<div className="flex items-start justify-between">
					<span className="text-gray-600">교통 접근성</span>
					<span className="text-gray-900 text-right flex-1 ml-4">
						{record.traffic_accessibility}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-gray-600">등록일</span>
					<span className="text-gray-900">{new Date(record.created_at).toLocaleDateString()}</span>
				</div>
			</div>
		</div>
	)
}
