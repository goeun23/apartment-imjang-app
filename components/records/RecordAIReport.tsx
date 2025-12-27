interface RecordAIReportProps {
	aiReport?: string
}

export default function RecordAIReport({ aiReport }: RecordAIReportProps) {
	const defaultReport = '이 매물은 초등학교가 가깝고 교통이 편리하여 거주 만족도가 높을 것으로 예상됩니다. 최근 거래가 대비 합리적인 가격대로 판단됩니다. (AI 분석 예시)'

	return (
		<div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-4">
			<div className="flex items-start gap-2">
				<span className="text-2xl">🤖</span>
				<div className="flex-1">
					<h3 className="font-semibold text-primary-900 mb-1">AI 한줄 리포트</h3>
					<p className="text-primary-800">
						{aiReport || defaultReport}
					</p>
				</div>
			</div>
		</div>
	)
}
