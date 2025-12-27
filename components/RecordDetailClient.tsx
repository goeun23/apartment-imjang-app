"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { addComment, deleteRecord } from "@/lib/services/recordService"
import { Record, RecordPhoto, Comment } from "@/types"
import {
  RecordCard,
  RecordAIReport,
  RecordBasicInfo,
  RecordImages,
  RecordMap,
  RecordMemo,
  RecordComments,
  RecordRange,
} from "@/components/records"

interface RecordDetailClientProps {
  record: Record & { record_photos: RecordPhoto[]; comments: Comment[] }
  currentUserId: string | null
}

export default function RecordDetailClient({
  record: initialRecord,
  currentUserId: initialCurrentUserId,
}: RecordDetailClientProps) {
  const router = useRouter()
  const [record, setRecord] = useState(initialRecord)
  const [currentUserId, setCurrentUserId] = useState(initialCurrentUserId)

  const handleAddComment = async (content: string) => {
    if (!content.trim() || !record) return

    try {
      const addedComment = await addComment(record.id, content)
      setRecord({
        ...record,
        comments: [...record.comments, addedComment],
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      alert("댓글 등록 중 오류가 발생했습니다.")
    }
  }

  const handleDelete = async () => {
    if (!record || !confirm("정말로 이 기록을 삭제하시겠습니까?")) return

    try {
      await deleteRecord(record.id)
      router.replace("/records")
      router.refresh()
    } catch (error) {
      console.error("Error deleting record:", error)
      alert("삭제 중 오류가 발생했습니다.")
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mr-3"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">임장 상세</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/records/${record.id}/edit`)}
              className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <RecordCard contents={<RecordImages photos={record.record_photos} />} />

      <div className="px-4 py-6 space-y-6">
        {/* AI Report */}
        <RecordCard
          title="AI 한 줄 리포트"
          contents={<RecordAIReport aiReport={record.ai_report} />}
        />

        {/* Basic Info */}
        <RecordCard title="기본 정보" contents={<RecordBasicInfo record={record} />} />

        {/* Map */}
        <RecordCard
          title="주변 상권"
          contents={<RecordMap latitude={record.latitude} longitude={record.longitude} />}
        />

        <RecordCard title="가격 범위" contents={<RecordRange record={record} />} />

        {/* Memo */}
        <RecordCard title="메모" contents={<RecordMemo memo={record.memo} />} />

        {/* Comments Section */}
        <RecordCard
          contents={
            <RecordComments
              comments={record.comments}
              currentUserId={currentUserId}
              onAddComment={handleAddComment}
            />
          }
        />
      </div>
    </main>
  )
}

