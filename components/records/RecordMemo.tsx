interface RecordMemoProps {
	memo?: string
}

export default function RecordMemo({ memo }: RecordMemoProps) {
	if (!memo) return null

	return <p className="text-gray-700 whitespace-pre-wrap">{memo}</p>
}
