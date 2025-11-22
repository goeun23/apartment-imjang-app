import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const regionCode = searchParams.get("regionCode")
  const yearMonth = searchParams.get("yearMonth")

  if (!regionCode || !yearMonth) {
    return NextResponse.json(
      { error: "Missing regionCode or yearMonth" },
      { status: 400 }
    )
  }

  // TODO: Real implementation with MOLIT API
  // const API_KEY = process.env.MOLIT_API_KEY
  // const url = `http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev?LAWD_CD=${regionCode}&DEAL_YMD=${yearMonth}&serviceKey=${API_KEY}`
  // const response = await fetch(url)
  // const data = await response.json() // Need XML to JSON conversion usually

  // Mock Data Generation
  const mockData = generateMockData(regionCode, yearMonth)

  // Save to Supabase
  const supabase = createRouteHandlerClient({ cookies })

  // We need to map our mock data to the DB schema
  // The DB schema expects: region_si, region_gu, apartment_name, transaction_date, price_in_hundred_million, area_pyeong, floor

  // Since we don't have full region info (si/gu split) perfectly here without a map,
  // we'll do a best effort or just save what we have.
  // For the mock, let's assume regionCode is just the Gu name passed from the frontend for now.

  const recordsToInsert = mockData.map((item) => ({
    region_si: "서울", // Defaulting for mock
    region_gu: regionCode,
    apartment_name: item.apartment_name,
    transaction_date: item.transaction_date,
    price_in_hundred_million: item.price_in_hundred_million,
    area_pyeong: item.area_pyeong,
    floor: item.floor,
    fetched_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from("market_prices").insert(recordsToInsert)

  if (error) {
    console.error("Error saving to Supabase:", error)
  }

  return NextResponse.json(recordsToInsert)
}

function generateMockData(region: string, yearMonth: string) {
  const apartments = [
    "래미안 퍼스티지",
    "자이 더 리버",
    "힐스테이트 센트럴",
    "푸르지오 써밋",
    "아이파크 시티",
    "롯데캐슬 골드",
    "e편한세상 그랑",
    "더샵 파크",
  ]

  const count = Math.floor(Math.random() * 10) + 5 // 5 to 14 items
  const data = []

  for (let i = 0; i < count; i++) {
    const day = Math.floor(Math.random() * 28) + 1
    const dateStr = `${yearMonth.slice(0, 4)}.${yearMonth.slice(4)}.${day
      .toString()
      .padStart(2, "0")}`

    data.push({
      apartment_name: apartments[Math.floor(Math.random() * apartments.length)],
      transaction_date: dateStr,
      price_in_hundred_million: Number((Math.random() * 20 + 10).toFixed(1)), // 10.0 ~ 30.0
      area_pyeong: [25, 30, 34, 40][Math.floor(Math.random() * 4)],
      floor: Math.floor(Math.random() * 20) + 1,
    })
  }

  return data.sort((a, b) =>
    b.transaction_date.localeCompare(a.transaction_date)
  )
}
