"use client"

interface AreaChipSelectorProps {
  value: 20 | 30
  onChange: (value: 20 | 30) => void
}

export default function AreaChipSelector({
  value,
  onChange,
}: AreaChipSelectorProps) {
  const options: Array<20 | 30> = [20, 30]

  return (
    <div className="flex gap-3">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            value === option
              ? "bg-primary-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {option}평
        </button>
      ))}
    </div>
  )
}
