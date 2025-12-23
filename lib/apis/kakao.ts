/**
 * 카카오 로컬 API를 사용한 주소 → 위도/경도 변환
 */

const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY

export interface GeocodeResult {
  latitude: number
  longitude: number
}

/**
 * 주소를 위도/경도로 변환 (카카오 로컬 API - 주소 검색)
 * @param address 전체 주소 문자열
 * @returns 위도/경도 정보 또는 null
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!KAKAO_REST_API_KEY) {
    console.error('KAKAO_REST_API_KEY가 설정되지 않았습니다.')
    return null
  }

  if (!address || address.trim() === '') {
    return null
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error('카카오 API 요청 실패:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    if (data.documents && data.documents.length > 0) {
      const firstResult = data.documents[0]
      return {
        latitude: parseFloat(firstResult.y), // 위도
        longitude: parseFloat(firstResult.x), // 경도
      }
    }

    return null
  } catch (error) {
    console.error('주소 변환 중 오류 발생:', error)
    return null
  }
}

