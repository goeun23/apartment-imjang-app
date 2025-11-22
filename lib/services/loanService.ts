import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { LoanCalculation, LtvRate } from "@/types"

export const saveLoanCalculation = async (
  current_asset: number,
  apartment_price: number,
  ltv_rate: LtvRate,
  max_loan_amount: number
) => {
  const supabase = createClientComponentClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from("loan_calculations")
    .insert({
      user_id: session.user.id,
      current_asset,
      apartment_price,
      ltv_rate,
      max_loan_amount,
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving loan calculation:", error)
    throw error
  }

  return data as LoanCalculation
}

export const getLoanCalculations = async () => {
  const supabase = createClientComponentClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return []

  const { data, error } = await supabase
    .from("loan_calculations")
    .select("*")
    .eq("user_id", session.user.id)
    .order("calculated_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error fetching loan calculations:", error)
    return []
  }

  return data as LoanCalculation[]
}
