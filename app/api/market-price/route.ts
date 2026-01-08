import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { XMLParser } from "fast-xml-parser"

const RECION_CODE_MAP: Record<string, string> = {
  "강남구": "11680",
  "서초구": "11650",
  "송파구": "11710",
  "마포구": "11440",
  "용산구": "11170",
  "성동구": "11200",
  "분당구": "41135",
  "수지구": "41465",
  "동안구": "41173",
  "영통구": "41117",
  "일산동구": "41285",
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const regionName = searchParams.get("regionCode")
  const yearMonth = searchParams.get("yearMonth")

  if (!regionName || !yearMonth) {
    return NextResponse.json(
      { error: "Missing regionCode or yearMonth" },
      { status: 400 }
    )
  }

  const lawdCd = RECION_CODE_MAP[regionName]
  if (!lawdCd) {
    console.warn(`Unknown region name: ${regionName}, trying as code if inclusive...`)
  }

  const API_KEY = process.env.MOLIT_API_KEY
  const DO_REAL_FETCH = !!API_KEY && !!lawdCd
  
  let recordsToReturn: any[] = []

  if (DO_REAL_FETCH) {
    try {
      const url = `http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev?LAWD_CD=${lawdCd}&DEAL_YMD=${yearMonth}&serviceKey=${API_KEY}&numOfRows=100`
      
      const response = await fetch(url)
      const xmlText = await response.text()
      
      const parser = new XMLParser()
      const jsonObj = parser.parse(xmlText)
      
      const items = jsonObj?.response?.body?.items?.item || []
      const records = Array.isArray(items) ? items : [items]

      recordsToReturn = records.map((item: any) => ({
        region_si: lawdCd.startsWith("11") ? "서울" : "경기",
        region_gu: regionName,
        apartment_name: item['아파트']?.trim() || item['Apartment']?.trim(),
        transaction_date: `${item['년']}.${String(item['월']).padStart(2, '0')}.${String(item['일']).padStart(2, '0')}`,
        price_in_hundred_million: parseFloat((parseInt(item['거래금액'].replace(/,/g, '')) / 10000).toFixed(1)), 
        area_pyeong: Math.round(parseFloat(item['전용면적']) / 3.3),
        floor: item['층'],
        fetched_at: new Date().toISOString(),
      }))

      recordsToReturn.sort((a: any, b: any) => b.transaction_date.localeCompare(a.transaction_date))

    } catch (e) {
      console.error("Failed to fetch from MOLIT API:", e)
    }
  } else {
    recordsToReturn = generateMockData(regionName, yearMonth).map((item) => ({
      ...item,
      region_si: "서울",
      region_gu: regionName,
      fetched_at: new Date().toISOString(),
    }))
  }

  if (recordsToReturn.length > 0) {
    const supabase = createRouteHandlerClient({ cookies })
  }

  return NextResponse.json(recordsToReturn)
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
