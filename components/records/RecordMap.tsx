import KakaoMap from '@/components/KakaoMap/index'

interface RecordMapProps {
	latitude?: number
	longitude?: number
}

export default function RecordMap({ latitude, longitude }: RecordMapProps) {
	if (!latitude || !longitude) {
		return (
			<div className="w-full h-96 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
				위치 정보가 없습니다
			</div>
		)
	}

	return (
		<div className="w-full h-96 rounded-lg overflow-hidden">
			<KakaoMap latitude={latitude} longitude={longitude} />
		</div>
	)
}
