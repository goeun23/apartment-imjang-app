import { createClient } from "@/lib/supabase/server"
import { SearchHistory } from "@/types"

export const getRecentSearches = async () => {
  const supabase = await createClient()

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

