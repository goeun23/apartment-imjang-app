"use client"

import { useState } from "react"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  max?: number
}

export default function StarRating({
  value,
  onChange,
  max = 5,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  return (
    <div className="flex gap-2">
      {[...Array(max)].map((_, index) => {
        const starValue = index + 1
        return (
          <button
            key={index}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHoverValue(starValue)}
            onMouseLeave={() => setHoverValue(0)}
            className="text-3xl transition-transform hover:scale-110"
          >
            <span
              className={
                starValue <= (hoverValue || value)
                  ? "text-yellow-400"
                  : "text-gray-300"
              }
            >
              ★
            </span>
          </button>
        )
      })}
      <span className="ml-2 text-gray-600 self-center">{value}/5</span>
    </div>
  )
}
