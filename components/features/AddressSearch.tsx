"use client"

import { useEffect, useRef } from "react"

interface DaumPostcodeResult {
  zonecode: string
  address: string
  addressEnglish: string
  addressType: "R" | "J"
  userSelectedType: "R" | "J"
  noSelected: "Y" | "N"
  userLanguageType: "K" | "E"
  roadAddress: string
  jibunAddress: string
  sido: string
  sigungu: string
  bname: string
  buildingName: string
}

interface AddressSearchProps {
  onComplete: (data: DaumPostcodeResult) => void
  onClose: () => void
}

declare global {
  interface Window {
    daum: any
  }
}

export function AddressSearch({ onComplete, onClose }: AddressSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
    script.async = true

    script.onload = () => {
      window.daum.postcode.load(() => {
        new window.daum.Postcode({
          oncomplete: (data: any) => {
            onComplete(data)
          },
          onresize: (size: any) => {
            if (containerRef.current) {
              containerRef.current.style.height = `${size.height}px`
            }
          },
          width: "100%",
          height: "100%",
        }).embed(containerRef.current)
      })
    }

    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg overflow-hidden shadow-xl relative">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">주소 검색</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div ref={containerRef} className="w-full min-h-[400px]" />
      </div>
    </div>
  )
}
