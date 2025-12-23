'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AreaChipSelector from '@/components/AreaChipSelector'
import StarRating from '@/components/StarRating'
import PhotoUploader from '@/components/PhotoUploader'
import { AddressSearch } from '@/components/features/AddressSearch'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { uploadPhotos } from '@/lib/supabase/storage'
import { createRecord } from '@/lib/services/recordService'
import { RegionSi } from '@/types'
import { geocodeAddress } from '@/lib/apis/kakao'

export default function NewRecordPage() {
	const router = useRouter()
	const [showAddressSearch, setShowAddressSearch] = useState(false)
	const [formData, setFormData] = useState({
		type: '아파트' as '대지' | '아파트',
		region_si: '서울' as RegionSi,
		region_gu: '',
		region_dong: '',
		address_full: '',
		apartment_name: '',
		area_pyeong: 30 as 20 | 30,
		price: '',
		school_accessibility: 3,
		traffic_accessibility: '',
		is_ltv_regulated: false,
		ltv_rate: 70 as 40 | 70,
		memo: '',
	})
	const [photos, setPhotos] = useState<File[]>([])
	const [latitude, setLatitude] = useState<number | null>(null)
	const [longitude, setLongitude] = useState<number | null>(null)

	const [loading, setLoading] = useState(false)

	const handleAddressComplete = async (data: any) => {
		const isSeoul = data.sido.includes('서울')
		const isGyeonggi = data.sido.includes('경기')

		let regionSi: RegionSi = '서울'
		if (isGyeonggi) regionSi = '경기'
		else if (!isSeoul) {
			alert('서울/경기 지역만 지원합니다.')
			return
		}

		const addressFull = data.roadAddress || data.jibunAddress

		setFormData({
			...formData,
			region_si: regionSi,
			region_gu: data.sigungu,
			region_dong: data.bname,
			address_full: addressFull,
			apartment_name: data.buildingName || formData.apartment_name,
		})

		// 주소를 위도/경도로 변환
		if (addressFull) {
			try {
				const coords = await geocodeAddress(addressFull)
				if (coords) {
					setLatitude(coords.latitude)
					setLongitude(coords.longitude)
				}
			} catch (error) {
				console.error('위도/경도 변환 실패:', error)
				// 위도/경도 변환 실패해도 계속 진행
			}
		}

		setShowAddressSearch(false)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			// 1. Upload photos
			let photoUrls: string[] = []
			if (photos.length > 0) {
				photoUrls = await uploadPhotos(photos)
			}

			// 2. Create record using service
			const record = await createRecord({
				type: formData.type,
				region_si: formData.region_si,
				region_gu: formData.region_gu,
				apartment_name: formData.apartment_name,
				area_pyeong: formData.area_pyeong,
				price_in_hundred_million: parseFloat(formData.price),
				school_accessibility: formData.school_accessibility,
				traffic_accessibility: formData.traffic_accessibility,
				is_ltv_regulated: formData.is_ltv_regulated,
				ltv_rate: formData.is_ltv_regulated ? formData.ltv_rate : (70 as 40 | 70), // Default if not regulated, though logic might need adjustment
				memo: formData.memo,
				// Optional fields
				region_dong: formData.region_dong,
				address_full: formData.address_full,
				latitude: latitude || undefined,
				longitude: longitude || undefined,
				ai_report: '',
			})

			// 3. Insert photos (This logic should ideally be in the service too, but keeping it here for now or moving it)
			// Actually, let's move the photo association to the service or just do it here using supabase client if service doesn't support it yet.
			// The service createRecord returns the record.
			// We need to insert photos.

			if (photoUrls.length > 0 && record) {
				const supabase = createClientComponentClient()
				const photoRecords = photoUrls.map((url, index) => ({
					record_id: record.id,
					photo_url: url,
					photo_order: index,
				}))

				const { error: photoError } = await supabase.from('record_photos').insert(photoRecords)

				if (photoError) throw photoError
			}

			alert('임장 기록이 저장되었습니다!')
			router.push('/')
			router.refresh()
		} catch (error: any) {
			console.error('Error saving record:', error)
			alert('저장 중 오류가 발생했습니다: ' + error.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="min-h-screen bg-gray-50 pb-20">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
				<div className="flex items-center">
					<button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 mr-3">
						←
					</button>
					<h1 className="text-xl font-bold text-gray-900">임장 등록</h1>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
				{/* 임장 유형 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">임장 유형</label>
					<div className="flex gap-3">
						{(['대지', '아파트'] as const).map((type) => (
							<button
								key={type}
								type="button"
								onClick={() => setFormData({ ...formData, type })}
								className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
									formData.type === type
										? 'bg-primary-600 text-white'
										: 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500'
								}`}
							>
								{type}
							</button>
						))}
					</div>
				</div>

				{/* 지역 선택 (주소 검색) */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
					<div className="flex gap-2 mb-2">
						<input
							type="text"
							value={formData.address_full || ''}
							readOnly
							placeholder="주소 검색을 클릭하세요"
							className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
						/>
						<button
							type="button"
							onClick={() => setShowAddressSearch(true)}
							className="px-4 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors whitespace-nowrap"
						>
							주소 검색
						</button>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<input
							type="text"
							value={formData.region_si}
							readOnly
							className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
						/>
						<input
							type="text"
							value={formData.region_gu}
							readOnly
							className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
						/>
					</div>
				</div>

				{showAddressSearch && (
					<AddressSearch
						onComplete={handleAddressComplete}
						onClose={() => setShowAddressSearch(false)}
					/>
				)}

				{/* 아파트 이름 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">아파트 이름</label>
					<input
						type="text"
						value={formData.apartment_name}
						onChange={(e) => setFormData({ ...formData, apartment_name: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						placeholder="예: 은마아파트"
					/>
				</div>

				{/* 평수 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">평수</label>
					<AreaChipSelector
						value={formData.area_pyeong}
						onChange={(area_pyeong) => setFormData({ ...formData, area_pyeong })}
					/>
				</div>

				{/* 가격 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">가격 (억)</label>
					<input
						type="number"
						step="0.1"
						value={formData.price}
						onChange={(e) => setFormData({ ...formData, price: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						placeholder="예: 15.5"
						required
					/>
				</div>

				{/* 초등학교 접근성 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">초등학교 접근성</label>
					<StarRating
						value={formData.school_accessibility}
						onChange={(school_accessibility) => setFormData({ ...formData, school_accessibility })}
					/>
				</div>

				{/* 교통 접근성 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">교통 접근성</label>
					<input
						type="text"
						value={formData.traffic_accessibility}
						onChange={(e) =>
							setFormData({
								...formData,
								traffic_accessibility: e.target.value,
							})
						}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						placeholder="예: 지하철역 도보 5분"
						required
					/>
				</div>

				{/* LTV 규제지역 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">LTV 규제지역 여부</label>
					<div className="flex gap-3">
						{[
							{ value: false, label: '비규제' },
							{ value: true, label: '규제지역' },
						].map((option) => (
							<button
								key={option.label}
								type="button"
								onClick={() => setFormData({ ...formData, is_ltv_regulated: option.value })}
								className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
									formData.is_ltv_regulated === option.value
										? 'bg-primary-600 text-white'
										: 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500'
								}`}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				{/* LTV 비율 */}
				{formData.is_ltv_regulated && (
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">LTV 비율</label>
						<div className="flex gap-3">
							{([40, 70] as const).map((rate) => (
								<button
									key={rate}
									type="button"
									onClick={() => setFormData({ ...formData, ltv_rate: rate })}
									className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
										formData.ltv_rate === rate
											? 'bg-primary-600 text-white'
											: 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500'
									}`}
								>
									{rate}%
								</button>
							))}
						</div>
					</div>
				)}

				{/* 메모 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
					<textarea
						value={formData.memo}
						onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
						rows={4}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
						placeholder="임장 시 느낀 점이나 특이사항을 기록해주세요"
					/>
				</div>

				{/* 사진 업로드 */}
				<PhotoUploader photos={photos} onPhotosChange={setPhotos} />

				{/* Submit Button */}
				<button
					type="submit"
					disabled={loading}
					className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md disabled:opacity-50"
				>
					{loading ? '저장 중...' : '저장하기'}
				</button>
			</form>
		</main>
	)
}
