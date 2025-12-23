'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { getRecord, addComment } from '@/lib/services/recordService'
import { Record, RecordPhoto, Comment } from '@/types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import KakaoMap from '@/components/KakaoMap/index'

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const router = useRouter()
	const { id } = use(params)
	const [newComment, setNewComment] = useState('')
	const [record, setRecord] = useState<
		(Record & { record_photos: RecordPhoto[]; comments: Comment[] }) | null
	>(null)
	const [loading, setLoading] = useState(true)
	const [currentUserId, setCurrentUserId] = useState<string | null>(null)
	const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  console.log('[RecordDetailPage] record', record)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const supabase = createClientComponentClient()
				const {
					data: { session },
				} = await supabase.auth.getSession()
				setCurrentUserId(session?.user.id || null)

				const data = await getRecord(id)
				setRecord(data)
			} catch (error) {
				console.error('Error fetching record:', error)
				alert('데이터를 불러오는 중 오류가 발생했습니다.')
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [id])

	const handleAddComment = async () => {
		if (!newComment.trim() || !record) return

		try {
			const addedComment = await addComment(record.id, newComment)
			setRecord({
				...record,
				comments: [...record.comments, addedComment],
			})
			setNewComment('')
		} catch (error) {
			console.error('Error adding comment:', error)
			alert('댓글 등록 중 오류가 발생했습니다.')
		}
	}

	const nextPhoto = () => {
		if (!record || !record.record_photos.length) return
		setCurrentPhotoIndex((prev) => (prev === record.record_photos.length - 1 ? 0 : prev + 1))
	}

	const prevPhoto = () => {
		if (!record || !record.record_photos.length) return
		setCurrentPhotoIndex((prev) => (prev === 0 ? record.record_photos.length - 1 : prev - 1))
	}

	const handleDelete = async () => {
		if (!record || !confirm('정말로 이 기록을 삭제하시겠습니까?')) return

		try {
			const { deleteRecord } = await import('@/lib/services/recordService')
			await deleteRecord(record.id)
			router.replace('/records')
			router.refresh()
		} catch (error) {
			console.error('Error deleting record:', error)
			alert('삭제 중 오류가 발생했습니다.')
		}
	}

	if (loading) {
		return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
	}

	if (!record) {
		return (
			<div className="min-h-screen flex items-center justify-center">기록을 찾을 수 없습니다.</div>
		)
	}

	// Sort photos by order
	const sortedPhotos = [...record.record_photos].sort((a, b) => a.photo_order - b.photo_order)

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
						<h1 className="text-xl font-bold text-gray-900">임장 상세</h1>
					</div>
					<div className="flex gap-2">
						<button
							onClick={() => router.push(`/records/${record.id}/edit`)}
							className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg"
						>
							수정
						</button>
						<button
							onClick={handleDelete}
							className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
						>
							삭제
						</button>
					</div>
				</div>
			</div>

			{/* Photo Gallery */}
			{sortedPhotos.length > 0 ? (
				<div className="relative bg-black">
					<img
						src={sortedPhotos[currentPhotoIndex].photo_url}
						alt={`사진 ${currentPhotoIndex + 1}`}
						className="w-full h-64 object-cover"
					/>
					{sortedPhotos.length > 1 && (
						<>
							<button
								onClick={prevPhoto}
								className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
							>
								‹
							</button>
							<button
								onClick={nextPhoto}
								className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
							>
								›
							</button>
							<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
								{sortedPhotos.map((_, index) => (
									<div
										key={index}
										className={`w-2 h-2 rounded-full ${
											index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
										}`}
									/>
								))}
							</div>
						</>
					)}
				</div>
			) : (
				<div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
					사진이 없습니다
				</div>
			)}

			<div className="px-4 py-6 space-y-6">
				{/* AI Report */}
				<div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-4">
					<div className="flex items-start gap-2">
						<span className="text-2xl">🤖</span>
						<div className="flex-1">
							<h3 className="font-semibold text-primary-900 mb-1">AI 한줄 리포트</h3>
							<p className="text-primary-800">
								{record.ai_report ||
									'이 매물은 초등학교가 가깝고 교통이 편리하여 거주 만족도가 높을 것으로 예상됩니다. 최근 거래가 대비 합리적인 가격대로 판단됩니다. (AI 분석 예시)'}
							</p>
						</div>
					</div>
				</div>

				{/* Basic Info */}
				<div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
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
							<p className="text-3xl font-bold text-primary-600">
								{record.price_in_hundred_million}억
							</p>
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
							<span className="text-gray-900">
								{new Date(record.created_at).toLocaleDateString()}
							</span>
						</div>
					</div>
				</div>

				{/* Map */}
				<div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
					<h3 className="font-semibold text-gray-900 mb-4">주변 상권</h3>
					<div className="w-full h-96 rounded-lg overflow-hidden">
						<KakaoMap latitude={record.latitude} longitude={record.longitude} />
					</div>
				</div>

				{/* Memo */}
				{record.memo && (
					<div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
						<h3 className="font-semibold text-gray-900 mb-2">메모</h3>
						<p className="text-gray-700 whitespace-pre-wrap">{record.memo}</p>
					</div>
				)}

				{/* Comments Section */}
				<div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
					<h3 className="font-semibold text-gray-900 mb-4">댓글 ({record.comments.length})</h3>

					{/* Comments List */}
					<div className="space-y-3 mb-4">
						{record.comments.map((comment) => (
							<div key={comment.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
								<div className="flex items-center justify-between mb-2">
									<span className="font-medium text-sm text-gray-900">
										{comment.user_id === currentUserId ? '본인' : '가족'}
									</span>
									<span className="text-xs text-gray-500">
										{new Date(comment.created_at).toLocaleString()}
									</span>
								</div>
								<p className="text-gray-700 text-sm">{comment.content}</p>
							</div>
						))}
					</div>

					{/* Add Comment */}
					<div className="flex gap-2">
						<input
							type="text"
							value={newComment}
							onChange={(e) => setNewComment(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
							placeholder="댓글을 입력하세요..."
							className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						/>
						<button
							onClick={handleAddComment}
							className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
						>
							등록
						</button>
					</div>
				</div>
			</div>
		</main>
	)
}
