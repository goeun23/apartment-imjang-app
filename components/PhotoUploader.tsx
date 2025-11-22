"use client"

import { useState, useRef } from "react"

interface PhotoUploaderProps {
  photos: File[]
  onPhotosChange: (photos: File[]) => void
  maxPhotos?: number
}

export default function PhotoUploader({
  photos,
  onPhotosChange,
  maxPhotos = 10,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remainingSlots = maxPhotos - photos.length

    if (files.length > remainingSlots) {
      alert(`최대 ${maxPhotos}장까지 업로드 가능합니다.`)
      return
    }

    // 파일 크기 체크 (5MB)
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert("5MB 이하의 이미지만 업로드 가능합니다.")
      return
    }

    // 미리보기 URL 생성
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls([...previewUrls, ...newPreviewUrls])

    // 부모 컴포넌트에 전달
    onPhotosChange([...photos, ...files])
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index)

    // 메모리 정리
    URL.revokeObjectURL(previewUrls[index])

    setPreviewUrls(newPreviewUrls)
    onPhotosChange(newPhotos)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        사진 ({photos.length}/{maxPhotos})
      </label>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {previewUrls.map((url, index) => (
          <div key={index} className="relative aspect-square">
            <img
              src={url}
              alt={`사진 ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors shadow-md"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add Photo Button */}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
          >
            <span className="text-3xl mb-1">+</span>
            <span className="text-xs">사진 추가</span>
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Info */}
      <p className="text-xs text-gray-500">
        💡 최대 {maxPhotos}장, 장당 5MB 이하의 이미지를 업로드할 수 있습니다.
      </p>
    </div>
  )
}
