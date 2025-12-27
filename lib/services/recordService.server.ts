import { createClient } from "@/lib/supabase/server"
import { Record, RecordPhoto, Comment } from "@/types"

export const getRecords = async () => {
  const supabase = await createClient()
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
  const supabase = await createClient()
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

