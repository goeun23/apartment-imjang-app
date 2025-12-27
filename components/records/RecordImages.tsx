import { useState } from 'react'
import { RecordPhoto } from '@/types'

interface RecordImagesProps {
	photos: RecordPhoto[]
}

export default function RecordImages({ photos }: RecordImagesProps) {
	const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

	const sortedPhotos = [...photos].sort((a, b) => a.photo_order - b.photo_order)

	const prevPhoto = () => {
		if (!sortedPhotos || sortedPhotos.length === 0) return
		setCurrentPhotoIndex((prev: number) => (prev === 0 ? sortedPhotos.length - 1 : prev - 1))
	}

	const nextPhoto = () => {
		if (!sortedPhotos || sortedPhotos.length === 0) return
		setCurrentPhotoIndex((prev: number) => (prev === sortedPhotos.length - 1 ? 0 : prev + 1))
	}

	return (
		<>
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
		</>
	)
}
