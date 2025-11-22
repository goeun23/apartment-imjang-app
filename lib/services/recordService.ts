import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Record, RecordPhoto, Comment } from "@/types"

export const getRecords = async () => {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from("records")
    .select(
      `
      *,
      record_photos (*)
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return data as (Record & { record_photos: RecordPhoto[] })[]
}

export const getRecord = async (id: string) => {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from("records")
    .select(
      `
      *,
      record_photos (*),
      comments (*)
    `
    )
    .eq("id", id)
    .single()

  if (error) {
    throw error
  }

  return data as Record & { record_photos: RecordPhoto[]; comments: Comment[] }
}

export const createRecord = async (
  record: Omit<Record, "id" | "user_id" | "created_at" | "updated_at">
) => {
  const supabase = createClientComponentClient()

  // Get current user
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("records")
    .insert({
      ...record,
      user_id: session.user.id,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Record
}

export const updateRecord = async (id: string, updates: Partial<Record>) => {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from("records")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Record
}

export const deleteRecord = async (id: string) => {
  const supabase = createClientComponentClient()
  const { error } = await supabase.from("records").delete().eq("id", id)

  if (error) {
    throw error
  }
}

export const addComment = async (recordId: string, content: string) => {
  const supabase = createClientComponentClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("comments")
    .insert({
      record_id: recordId,
      user_id: session.user.id,
      content,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Comment
}
