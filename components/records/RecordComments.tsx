import { useState } from 'react'
import { Comment } from '@/types'

interface RecordCommentsProps {
	comments: Comment[]
	currentUserId: string | null
	onAddComment: (content: string) => Promise<void>
}

export default function RecordComments({
	comments,
	currentUserId,
	onAddComment,
}: RecordCommentsProps) {
	const [newComment, setNewComment] = useState('')

	const handleAddComment = async () => {
		if (!newComment.trim()) return

		await onAddComment(newComment)
		setNewComment('')
	}

	return (
		<>
			<h3 className="font-semibold text-gray-900 mb-4">댓글 ({comments.length})</h3>

			{/* Comments List */}
			<div className="space-y-3 mb-4">
				{comments.map((comment) => (
					<div key={comment.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
						<div className="flex items-center justify-between mb-2">
							<span className="font-medium text-sm text-gray-900">
								{comment.user_id === currentUserId ? '본인' : '가족'}
							</span>
							<span className="text-xs text-gray-500">
								{new Date(comment.created_at).toLocaleString()}
							</span>
						</div>
						<p className="text-gray-700 text-sm">{comment.content}</p>
					</div>
				))}
			</div>

			{/* Add Comment */}
			<div className="flex gap-2">
				<input
					type="text"
					value={newComment}
					onChange={(e) => setNewComment(e.target.value)}
					onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
					placeholder="댓글을 입력하세요..."
					className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				/>
				<button
					onClick={handleAddComment}
					className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
				>
					등록
				</button>
			</div>
		</>
	)
}
