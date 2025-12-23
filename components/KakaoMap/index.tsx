'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import '../KakaoMap/kakaoMap.style.css'

const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY

declare global {
	interface Window {
		kakao: any
	}
}

interface KakaoMapProps {
	latitude: number
	longitude: number
}

export default function KakaoMap({ latitude, longitude }: KakaoMapProps) {
	const [isScriptLoaded, setIsScriptLoaded] = useState(false)
	const mapRef = useRef<HTMLDivElement>(null)
	const mapInstanceRef = useRef<any>(null)
	const placeOverlayRef = useRef<any>(null)
	const contentNodeRef = useRef<HTMLDivElement | null>(null)
	const markersRef = useRef<any[]>([])
	const currentLocationMarkerRef = useRef<any>(null) // 현재 위치 마커
	const currCategoryRef = useRef<string>('')

	// 카카오맵 스크립트 로드 완료 후 초기화
	useEffect(() => {
		if (!isScriptLoaded || !mapRef.current || !window.kakao) {
			console.log('[KakaoMap] 스크립트 아직 로드 안됨')
			return
		}

		const { kakao } = window

		// 재시도 횟수 제한
		let retryCount = 0
		const MAX_RETRIES = 50 // 최대 5초 (100ms * 50)

		// 카카오맵 API가 완전히 로드될 때까지 대기
		const initMap = () => {
			retryCount++

			// 최대 재시도 횟수 초과 시 중단
			if (retryCount > MAX_RETRIES) {
				console.error('[KakaoMap] 최대 재시도 횟수 초과. 지도 초기화 실패')
				return
			}

			// 필요한 모든 클래스가 로드되었는지 확인
			const hasMaps = !!kakao.maps
			const hasMap = !!kakao.maps?.Map
			const hasLatLng = !!kakao.maps?.LatLng
			const hasCustomOverlay = !!kakao.maps?.CustomOverlay
			const hasServices = !!kakao.maps?.services
			const hasPlaces = !!kakao.maps?.services?.Places

			if (!hasMaps || !hasMap || !hasLatLng || !hasCustomOverlay || !hasServices || !hasPlaces) {
				setTimeout(initMap, 100)
				return
			}

			// 지도 컨테이너 크기 확인
			const containerSize = mapRef.current
				? { width: mapRef.current.offsetWidth, height: mapRef.current.offsetHeight }
				: null

			if (
				!mapRef.current ||
				mapRef.current.offsetWidth === 0 ||
				mapRef.current.offsetHeight === 0
			) {
				setTimeout(initMap, 100)
				return
			}

			try {
				// 지도 초기화 (먼저 지도를 생성)
				const mapOption = {
					center: new kakao.maps.LatLng(latitude, longitude),
					level: 5,
				}

				const map = new kakao.maps.Map(mapRef.current, mapOption)
				mapInstanceRef.current = map

				// 현재 위치 마커 추가 (위도/경도가 있을 때만)
				if (latitude && longitude) {
					const markerPosition = new kakao.maps.LatLng(latitude, longitude)
					const marker = new kakao.maps.Marker({
						position: markerPosition,
					})
					marker.setMap(map)
					currentLocationMarkerRef.current = marker
				}

				// contentNode 생성
				const contentNode = document.createElement('div')

				// custom overlay content node css class 추가
				contentNode.className = 'placeinfo_wrap'
				contentNodeRef.current = contentNode

				// placeOverlay 생성
				const placeOverlay = new kakao.maps.CustomOverlay({ zIndex: 1 })
				placeOverlay.setContent(contentNode)
				placeOverlayRef.current = placeOverlay

				// 장소검색 객체 생성
				const ps = new kakao.maps.services.Places()

				// 지도에 idle 이벤트 등록
				kakao.maps.event.addListener(map, 'idle', () => searchPlaces(map, ps))

				addEventHandle(contentNode, 'mousedown', kakao.maps.event.preventMap)
				addEventHandle(contentNode, 'touchstart', kakao.maps.event.preventMap)

				addCategoryClickEvent(map, ps)
			} catch (error) {
				console.error('[KakaoMap] 카카오맵 초기화 오류:', error)
			}
		}

		// autoload=false로 설정했으므로 이미 스크립트 onLoad에서 load()를 호출했음
		// 여기서는 바로 초기화 시도 (이미 API가 로드되어 있어야 함)

		// 약간의 지연을 두고 초기화 (스크립트 onLoad의 load() 콜백이 완료될 시간 확보)
		setTimeout(initMap, 300)
	}, [isScriptLoaded, latitude, longitude])

	function addEventHandle(target: HTMLElement, type: string, callback: (e: Event) => void) {
		if (target.addEventListener) {
			target.addEventListener(type, callback)
		} else {
			;(target as any).attachEvent('on' + type, callback)
		}
	}

	function searchPlaces(map: any, ps: any) {
		const { kakao } = window
		if (!currCategoryRef.current) return

		placeOverlayRef.current?.setMap(null)
		removeMarker()

		// 검색 중심 좌표 결정: props로 받은 위도/경도가 있으면 사용, 없으면 지도 중심 사용
		let searchLocation: any
		if (latitude && longitude) {
			// props로 받은 위도/경도 사용 (기록된 위치 중심)
			searchLocation = new kakao.maps.LatLng(latitude, longitude)
		} else {
			// 지도의 현재 중심 좌표 사용 (지도 이동 후 검색 시)
			const center = map.getCenter()
			searchLocation = new kakao.maps.LatLng(center.getLat(), center.getLng())
		}

		// 위도/경도 중심으로 주변 검색 (반경 1000m)
		ps.categorySearch(currCategoryRef.current, placesSearchCB, {
			location: searchLocation,
			radius: 20000, // 1km 반경
		})
	}

	// 장소검색이 완료됐을 때 호출되는 콜백함수 입니다
	function placesSearchCB(data: any, status: any, pagination: any) {
		const { kakao } = window

		if (status === kakao.maps.services.Status.OK) {
			// 정상적으로 검색이 완료됐으면 지도에 마커를 표출합니다
			displayPlaces(data)
		} else if (status === kakao.maps.services.Status.ZERO_RESULT) {
			// 검색결과가 없는경우 해야할 처리가 있다면 이곳에 작성해 주세요
		} else if (status === kakao.maps.services.Status.ERROR) {
			// 에러로 인해 검색결과가 나오지 않은 경우 해야할 처리가 있다면 이곳에 작성해 주세요
		}
	}

	// 지도에 마커를 표출하는 함수입니다
	function displayPlaces(places: any[]) {
		const { kakao } = window
		// 몇번째 카테고리가 선택되어 있는지 얻어옵니다
		// 이 순서는 스프라이트 이미지에서의 위치를 계산하는데 사용됩니다
		const categoryElement = document.getElementById(currCategoryRef.current)
		if (!categoryElement) return

		const order = categoryElement.getAttribute('data-order') || '0'

		for (let i = 0; i < places.length; i++) {
			// 마커를 생성하고 지도에 표시합니다
			const marker = addMarker(new kakao.maps.LatLng(places[i].y, places[i].x), parseInt(order))

			// 마커와 검색결과 항목을 클릭 했을 때
			// 장소정보를 표출하도록 클릭 이벤트를 등록합니다
			;(function (marker, place) {
				kakao.maps.event.addListener(marker, 'click', function () {
					displayPlaceInfo(place)
				})
			})(marker, places[i])
		}
	}

	// 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
	function addMarker(position: any, order: number) {
		const { kakao } = window
		const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/places_category.png' // 마커 이미지 url, 스프라이트 이미지를 씁니다
		const imageSize = new kakao.maps.Size(27, 28) // 마커 이미지의 크기
		const imgOptions = {
			spriteSize: new kakao.maps.Size(72, 208), // 스프라이트 이미지의 크기
			spriteOrigin: new kakao.maps.Point(46, order * 36), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
			offset: new kakao.maps.Point(11, 28), // 마커 좌표에 일치시킬 이미지 내에서의 좌표
		}
		const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions)
		const marker = new kakao.maps.Marker({
			position: position, // 마커의 위치
			image: markerImage,
		})

		marker.setMap(mapInstanceRef.current) // 지도 위에 마커를 표출합니다
		markersRef.current.push(marker) // 배열에 생성된 마커를 추가합니다

		return marker
	}

	// 지도 위에 표시되고 있는 마커를 모두 제거합니다
	function removeMarker() {
		for (let i = 0; i < markersRef.current.length; i++) {
			markersRef.current[i].setMap(null)
		}
		markersRef.current = []
	}

	// 클릭한 마커에 대한 장소 상세정보를 커스텀 오버레이로 표시하는 함수입니다
	function displayPlaceInfo(place: any) {
		const { kakao } = window
		if (!contentNodeRef.current || !placeOverlayRef.current) return

		let content =
			'<div class="placeinfo">' +
			'   <a class="title" href="' +
			place.place_url +
			'" target="_blank" title="' +
			place.place_name +
			'">' +
			place.place_name +
			'</a>'

		if (place.road_address_name) {
			content +=
				'    <span title="' +
				place.road_address_name +
				'">' +
				place.road_address_name +
				'</span>' +
				'  <span class="jibun" title="' +
				place.address_name +
				'">(지번 : ' +
				place.address_name +
				')</span>'
		} else {
			content += '    <span title="' + place.address_name + '">' + place.address_name + '</span>'
		}

		content +=
			'    <span class="tel">' + place.phone + '</span>' + '</div>' + '<div class="after"></div>'

		contentNodeRef.current.innerHTML = content
		placeOverlayRef.current.setPosition(new kakao.maps.LatLng(place.y, place.x))
		placeOverlayRef.current.setMap(mapInstanceRef.current)
	}

	// 각 카테고리에 클릭 이벤트를 등록합니다
	function addCategoryClickEvent(map: any, ps: any) {
		const category = document.getElementById('category')
		if (!category) return

		const children = category.children

		for (let i = 0; i < children.length; i++) {
			children[i].addEventListener('click', function (this: HTMLElement) {
				onClickCategory.call(this, map, ps)
			})
		}
	}

	// 카테고리를 클릭했을 때 호출되는 함수입니다
	function onClickCategory(this: HTMLElement, map: any, ps: any) {
		const id = this.id
		const className = this.className

		placeOverlayRef.current?.setMap(null)

		if (className === 'on') {
			currCategoryRef.current = ''
			changeCategoryClass(null)
			removeMarker()
		} else {
			currCategoryRef.current = id
			changeCategoryClass(this)
			searchPlaces(map, ps)
		}
	}

	// 클릭된 카테고리에만 클릭된 스타일을 적용하는 함수입니다
	function changeCategoryClass(el: HTMLElement | null) {
		const category = document.getElementById('category')
		if (!category) return

		const children = category.children

		for (let i = 0; i < children.length; i++) {
			;(children[i] as HTMLElement).className = ''
		}

		if (el) {
			el.className = 'on'
		}
	}

	return (
		<>
			<Script
				src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&autoload=false&libraries=services`}
				strategy="afterInteractive"
				onLoad={() => {
					if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
						window.kakao.maps.load(() => {
							setIsScriptLoaded(true)
						})
					} else {
						console.log('[KakaoMap] kakao.maps.load 없음, 직접 설정')
						setIsScriptLoaded(true)
					}
				}}
				onError={(e) => {
					console.error('[KakaoMap] 스크립트 로드 실패', e)
				}}
			/>
			<div className="map_wrap">
				<div id="map" ref={mapRef} style={{ width: '100%', height: '100%' }} />
				<ul id="category">
					<li id="SC4" data-order="0">
						<span className="category_bg school"></span>
						학교
					</li>
					<li id="SW8" data-order="1">
						<span className="category_bg subway"></span>
						지하철
					</li>
					<li id="HP8" data-order="2">
						<span className="category_bg hospital"></span>
						병원
					</li>
					<li id="MT1" data-order="3">
						<span className="category_bg mart"></span>
						대형마트
					</li>
				</ul>
			</div>
		</>
	)
}
