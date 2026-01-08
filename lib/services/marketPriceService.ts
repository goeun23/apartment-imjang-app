import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { MarketPrice } from "@/types"
import { fetchMarketPricesAction } from "@/lib/actions/marketPrice"

export async function getMarketPrices(
  regionCode: string,
  yearMonth: string
): Promise<MarketPrice[]> {
  const supabase = createClientComponentClient()

  const { data, error } = await supabase
    .from("market_prices")
    .select("*")
    .eq("region_gu", regionCode)
    .like("transaction_date", `${yearMonth}%`)
    .order("transaction_date", { ascending: false })

  if (error) {
    console.error("Error fetching market prices from DB:", error)
    return []
  }

  if (data && data.length > 0) {
    return data as MarketPrice[]
  }

  try {
    const newData = await fetchMarketPricesAction(regionCode, yearMonth)
    return newData
  } catch (error) {
    console.error("Error fetching market prices from API:", error)
    return []
  }
}
