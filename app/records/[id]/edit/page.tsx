'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { getRecord, updateRecord } from '@/lib/services/recordService'
import { uploadPhotos } from '@/lib/supabase/storage'
import AreaChipSelector from '@/components/AreaChipSelector'
import StarRating from '@/components/StarRating'
import PhotoUploader from '@/components/PhotoUploader'
import { AddressSearch } from '@/components/features/AddressSearch'
import { RecordType, AreaPyeong, LtvRate, RegionSi } from '@/types'
import { geocodeAddress } from '@/lib/apis/kakao'
import MoneyRange from '@/components/features/MoneyRange'

export default function EditRecordPage({ params }: { params: Promise<{ id: string }> }) {
	const router = useRouter()
	const { id } = use(params)
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [showAddressSearch, setShowAddressSearch] = useState(false)

	// Form State
	const [type, setType] = useState<RecordType>('아파트')
	const [regionSi, setRegionSi] = useState<RegionSi>('서울')
	const [regionGu, setRegionGu] = useState('')
	const [regionDong, setRegionDong] = useState('')
	const [addressFull, setAddressFull] = useState('')
	const [apartmentName, setApartmentName] = useState('')
	const [price, setPrice] = useState('')
	const [area, setArea] = useState<AreaPyeong>(30)
	const [schoolScore, setSchoolScore] = useState(3)
	const [trafficDesc, setTrafficDesc] = useState('')
	const [isLtvRegulated, setIsLtvRegulated] = useState(true)
	const [ltvRate, setLtvRate] = useState<LtvRate>(40)
	const [memo, setMemo] = useState('')
	const [photos, setPhotos] = useState<File[]>([])
	const [existingPhotos, setExistingPhotos] = useState<{ id: string; url: string }[]>([])
	const [latitude, setLatitude] = useState<number | null>(null)
	const [longitude, setLongitude] = useState<number | null>(null)

	useEffect(() => {
		const fetchRecord = async () => {
			try {
				const record = await getRecord(id)
				if (!record) {
					alert('기록을 찾을 수 없습니다.')
					router.push('/records')
					return
				}

				// Populate form
				setType(record.type)
				setRegionSi(record.region_si)
				setRegionGu(record.region_gu)
				setRegionDong(record.region_dong || '')
				setAddressFull(record.address_full || '')
				setApartmentName(record.apartment_name || '')
				setPrice(record.price_in_hundred_million.toString())
				setArea(record.area_pyeong)
				setSchoolScore(record.school_accessibility)
				setTrafficDesc(record.traffic_accessibility)
				setIsLtvRegulated(record.is_ltv_regulated)
				setLtvRate(record.ltv_rate)
				setMemo(record.memo || '')
				setLatitude(record.latitude || null)
				setLongitude(record.longitude || null)
				setExistingPhotos(record.record_photos.map((p) => ({ id: p.id, url: p.photo_url })))
			} catch (error) {
				console.error('Error fetching record:', error)
				alert('데이터를 불러오는 중 오류가 발생했습니다.')
			} finally {
				setLoading(false)
			}
		}
		fetchRecord()
	}, [id, router])

	const handleAddressComplete = async (data: any) => {
		const isSeoul = data.sido.includes('서울')
		const isGyeonggi = data.sido.includes('경기')

		let newRegionSi: RegionSi = '서울'
		if (isGyeonggi) newRegionSi = '경기'
		else if (!isSeoul) {
			alert('서울/경기 지역만 지원합니다.')
			return
		}

		const addressFull = data.roadAddress || data.jibunAddress

		setRegionSi(newRegionSi)
		setRegionGu(data.sigungu)
		setRegionDong(data.bname)
		setAddressFull(addressFull)
		setApartmentName(data.buildingName || apartmentName)

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

	const handleSubmit = async () => {
		if (!regionGu || !price || !trafficDesc || !apartmentName) {
			alert('필수 항목을 모두 입력해주세요')
			return
		}

		setSubmitting(true)
		try {
			const supabase = createClientComponentClient()

			// 1. Upload new photos if any
			let newPhotoUrls: string[] = []
			if (photos.length > 0) {
				newPhotoUrls = await uploadPhotos(photos)
			}

			// 2. Update record
			await updateRecord(id, {
				type,
				region_si: regionSi,
				region_gu: regionGu,
				region_dong: regionDong,
				address_full: addressFull,
				apartment_name: apartmentName,
				price_in_hundred_million: parseFloat(price),
				area_pyeong: area,
				school_accessibility: schoolScore,
				traffic_accessibility: trafficDesc,
				is_ltv_regulated: isLtvRegulated,
				ltv_rate: isLtvRegulated ? ltvRate : 70, // Default to 70 if not regulated
				memo,
				latitude: latitude || undefined,
				longitude: longitude || undefined,
			})

			// 3. Insert new photo records
			if (newPhotoUrls.length > 0) {
				const startOrder = existingPhotos.length
				const photoRecords = newPhotoUrls.map((url, index) => ({
					record_id: id,
					photo_url: url,
					photo_order: startOrder + index,
				}))

				const { error: photoError } = await supabase.from('record_photos').insert(photoRecords)

				if (photoError) throw photoError
			}

			router.push(`/records/${id}`)
			router.refresh()
		} catch (error) {
			console.error('Error updating record:', error)
			alert('수정 중 오류가 발생했습니다.')
		} finally {
			setSubmitting(false)
		}
	}

	if (loading) {
		return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
	}

	return (
		<main className="min-h-screen bg-gray-50 pb-20">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
				<div className="flex items-center">
					<button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 mr-3">
						←
					</button>
					<h1 className="text-xl font-bold text-gray-900">임장 기록 수정</h1>
				</div>
			</div>

			<div className="px-4 py-6 space-y-8">
				{/* Type Selection */}
				<section>
					<label className="block text-sm font-medium text-gray-700 mb-3">임장 유형</label>
					<div className="flex gap-3">
						{(['아파트', '대지'] as const).map((t) => (
							<button
								key={t}
								onClick={() => setType(t)}
								className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
									type === t
										? 'bg-primary-600 text-white shadow-md'
										: 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500'
								}`}
							>
								{t}
							</button>
						))}
					</div>
				</section>

				{/* Region Selection */}
				<section>
					<label className="block text-sm font-medium text-gray-700 mb-3">지역 선택</label>
					<div className="flex gap-2 mb-2">
						<input
							type="text"
							value={addressFull}
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
					<div className="grid grid-cols-2 gap-3 mb-3">
						<input
							type="text"
							value={regionSi}
							readOnly
							className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
						/>
						<input
							type="text"
							value={regionGu}
							readOnly
							className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
						/>
					</div>
				</section>

				{showAddressSearch && (
					<AddressSearch
						onComplete={handleAddressComplete}
						onClose={() => setShowAddressSearch(false)}
					/>
				)}

				{/* Apartment Name */}
				<section>
					<label className="block text-sm font-medium text-gray-700 mb-3">아파트 이름</label>
					<input
						type="text"
						value={apartmentName}
						onChange={(e) => setApartmentName(e.target.value)}
						placeholder="예: 래미안 퍼스티지"
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					/>
				</section>

				{/* Area Selection */}
				<section>
					<label className="block text-sm font-medium text-gray-700 mb-3">평수 선택</label>
					<AreaChipSelector value={area} onChange={setArea} />
				</section>

				{/* Price Input */}
				<section>
					<label className="block text-sm font-medium text-gray-700 mb-3">매매 가격 (억)</label>
					<input
						type="number"
						step="0.1"
						value={price}
						onChange={(e) => setPrice(e.target.value)}
						placeholder="예: 15.5"
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					/>
				</section>

				{/* School Accessibility */}
				<section>
					<label className="block text-sm font-medium text-gray-700 mb-3">초등학교 접근성</label>
					<StarRating value={schoolScore} onChange={setSchoolScore} />
				</section>

				{/* Traffic Accessibility */}
				<section>
					<label className="block text-sm font-medium text-gray-700 mb-3">교통 접근성</label>
					<textarea
						value={trafficDesc}
						onChange={(e) => setTrafficDesc(e.target.value)}
						placeholder="예: 강남역 도보 10분, 버스정류장 바로 앞"
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none"
					/>
				</section>

				{/* LTV Regulation */}
				<section>
					<div className="flex items-center justify-between mb-3">
						<label className="text-sm font-medium text-gray-700">LTV 규제 지역 여부</label>
						<div className="flex items-center gap-3">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									checked={isLtvRegulated}
									onChange={() => setIsLtvRegulated(true)}
									className="w-4 h-4 text-primary-600 focus:ring-primary-500"
								/>
								<span className="text-sm text-gray-600">규제</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									checked={!isLtvRegulated}
									onChange={() => setIsLtvRegulated(false)}
									className="w-4 h-4 text-primary-600 focus:ring-primary-500"
								/>
								<span className="text-sm text-gray-600">비규제</span>
							</label>
						</div>
					</div>

					{isLtvRegulated && (
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<label className="block text-xs font-medium text-gray-500 mb-2">적용 LTV 비율</label>
							<div className="flex gap-2">
								{(
									[
										{ value: 40, label: '40%' },
										{ value: 70, label: '70%' },
									] as const
								).map((option) => (
									<button
										key={option.value}
										onClick={() => setLtvRate(option.value)}
										className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
											ltvRate === option.value
												? 'bg-primary-600 text-white'
												: 'bg-white border border-gray-300 text-gray-700'
										}`}
									>
										{option.label}
									</button>
								))}
							</div>
						</div>
					)}
				</section>

				{/* Memo */}
				<section>
					<label className="block text-sm font-medium text-gray-700 mb-3">메모</label>
					<textarea
						value={memo}
						onChange={(e) => setMemo(e.target.value)}
						placeholder="기타 특이사항을 자유롭게 기록하세요"
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-32 resize-none"
					/>
			
				</section>

				{/* Photo Upload */}
				<section>
					<label className="block text-sm font-medium text-gray-700 mb-3">현장 사진 (추가)</label>
					<div className="mb-4">
						<p className="text-xs text-gray-500 mb-2">기존 사진</p>
						<div className="flex gap-2 overflow-x-auto pb-2">
							{existingPhotos.map((photo) => (
								<img
									key={photo.id}
									src={photo.url}
									alt="Existing"
									className="w-20 h-20 object-cover rounded-lg border border-gray-200"
								/>
							))}
						</div>
					</div>
					<PhotoUploader photos={photos} onPhotosChange={setPhotos} />
				</section>

				{/* Submit Button */}
				<button
					onClick={handleSubmit}
					disabled={submitting}
					className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
				>
					{submitting ? '수정 중...' : '수정 완료'}
				</button>
			</div>
		</main>
	)
}
