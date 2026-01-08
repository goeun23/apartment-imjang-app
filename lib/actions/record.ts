'use server'
import { createClient } from "@/lib/supabase/server"
import { Record, RecordPhoto } from "@/types"

export async function fetchRecordsAction({ page = 1, limit = 10 }: { page?: number, limit?: number }) {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error } = await supabase
    .from("records")
    .select(
      `
      *,
      record_photos (*)
    `
    )
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    console.error("Error fetching records:", error)
    return []
  }

  return data as (Record & { record_photos: RecordPhoto[] })[]
}
