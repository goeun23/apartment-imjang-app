interface RecordCardProps {
	title?: string
	contents: React.ReactNode
}
export default function RecordCard({ title, contents }: RecordCardProps) {
	return (
		<div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
			{title && <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>}
			{contents}
		</div>
	)
}
