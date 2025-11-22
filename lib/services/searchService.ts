import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SearchHistory } from "@/types"

export const getRecentSearches = async () => {
  const supabase = createClientComponentClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return []

  const { data, error } = await supabase
    .from("search_history")
    .select("*")
    .eq("user_id", session.user.id)
    .order("searched_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error fetching search history:", error)
    return []
  }

  return data as SearchHistory[]
}

export const addSearchHistory = async (
  region_si: string,
  region_gu: string
) => {
  const supabase = createClientComponentClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  // Check if the same search exists recently to avoid duplicates (optional but good UX)
  // For now, just insert.

  const { data, error } = await supabase
    .from("search_history")
    .insert({
      user_id: session.user.id,
      region_si,
      region_gu,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding search history:", error)
    throw error
  }

  return data as SearchHistory
}
