import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getRecord } from '@/lib/services/recordService.server'
import { createClient } from '@/lib/supabase/server'
import RecordDetailClient from '@/components/RecordDetailClient'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>
}): Promise<Metadata> {
	const { id } = await params
	try {
		const record = await getRecord(id)
		return {
			title: `${record.apartment_name || '임장 기록'} - 아파트 임장 기록`,
			description: `${record.region_si} ${record.region_gu} ${
				record.apartment_name || ''
			} 임장 정보`,
			openGraph: {
				images: record.record_photos[0]?.photo_url ? [record.record_photos[0].photo_url] : [],
			},
		}
	} catch (error) {
		return {
			title: '임장 기록 상세',
			description: '아파트 임장 정보를 확인하세요',
		}
	}
}

export default async function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params

	let record
	let currentUserId: string | null = null

	try {
		const supabase = await createClient()
		const {
			data: { session },
		} = await supabase.auth.getSession()
		currentUserId = session?.user.id || null

		record = await getRecord(id)
	} catch (error) {
		console.error('Error fetching record:', error)
		notFound()
	}

	if (!record) {
		notFound()
	}

	return <RecordDetailClient record={record} currentUserId={currentUserId} />
}
