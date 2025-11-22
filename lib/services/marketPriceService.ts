import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { MarketPrice } from "@/types"

export async function getMarketPrices(
  regionCode: string,
  yearMonth: string
): Promise<MarketPrice[]> {
  const supabase = createClientComponentClient()

  // 1. Try to fetch from Supabase first
  const { data, error } = await supabase
    .from("market_prices")
    .select("*")
    .eq("region_gu", regionCode) // Note: This might need adjustment based on actual data structure (gu code vs name)
    .like("transaction_date", `${yearMonth}%`)
    .order("transaction_date", { ascending: false })

  if (error) {
    console.error("Error fetching market prices from DB:", error)
    return []
  }

  // 2. If data exists, return it
  if (data && data.length > 0) {
    return data as MarketPrice[]
  }

  // 3. If no data, fetch from external API (via our internal API route)
  try {
    const response = await fetch(
      `/api/market-price?regionCode=${regionCode}&yearMonth=${yearMonth}`
    )
    if (!response.ok) throw new Error("Failed to fetch from external API")

    const newData = await response.json()
    return newData as MarketPrice[]
  } catch (error) {
    console.error("Error fetching market prices from API:", error)
    return []
  }
}
