export type RecordType = "대지" | "아파트"
export type AreaPyeong = 20 | 30
export type LtvRate = 40 | 70
export type RegionSi = "서울" | "경기"

export interface Record {
  id: string
  user_id: string
  type: RecordType
  area_pyeong: AreaPyeong
  price_in_hundred_million: number
  region_si: RegionSi
  region_gu: string
  region_dong?: string
  address_full?: string
  apartment_name?: string
  latitude?: number
  longitude?: number
  school_accessibility: number // 1-5
  traffic_accessibility: string
  is_ltv_regulated: boolean
  ltv_rate: LtvRate
  memo?: string
  ai_report?: string
  created_at: string
  updated_at: string
}

export interface RecordPhoto {
  id: string
  record_id: string
  photo_url: string
  photo_order: number
  created_at: string
}

export interface Comment {
  id: string
  record_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface SearchHistory {
  id: string
  user_id: string
  region_si: string
  region_gu: string
  searched_at: string
}

export interface LoanCalculation {
  id: string
  user_id: string
  current_asset: number
  apartment_price: number
  ltv_rate: LtvRate
  max_loan_amount: number
  calculated_at: string
}

export interface MarketPrice {
  id: string
  region_si: RegionSi
  region_gu: string
  apartment_name: string
  transaction_date: string
  price_in_hundred_million: number
  area_pyeong: number
  floor: number
  fetched_at: string
}
