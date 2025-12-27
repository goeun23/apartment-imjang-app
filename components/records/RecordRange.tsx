'use client'

import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { useState, useMemo } from 'react'
import { Record } from '@/types'

interface RecordRangeProps {
	record: Record
	currentAsset?: number
}

export default function RecordRange({ record, currentAsset }: RecordRangeProps) {
	const defaultAsset = currentAsset || record.price_in_hundred_million * 0.6
	const [asset, setAsset] = useState(defaultAsset)
	const [isFirstTime, setIsFirstTime] = useState(false)

	// 생애최초에 따라 LTV 비율 결정
	const ltvRate = useMemo(() => {
		return isFirstTime ? 0.7 : 0.4
	}, [isFirstTime, record.ltv_rate])

	// 모든 계산을 useMemo로 처리
	const calculations = useMemo(() => {
		const apartmentPrice = record.price_in_hundred_million
		const maxLoanAmount = apartmentPrice * ltvRate
		const actualAsset = Math.min(asset, apartmentPrice)
		const actualLoanAmount = Math.max(maxLoanAmount, apartmentPrice - actualAsset)

		const assetRatio = (actualAsset / apartmentPrice) * 100
		const loanRatio = (actualLoanAmount / apartmentPrice) * 100

	

		// 월 상환액 계산
		const monthlyInterestRate = 0.04 / 12
		const numberOfPayments = 20 * 12
		const monthlyPayment =
			(actualLoanAmount *
				(monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments))) /
			(Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)

		const totalInterest = monthlyPayment * numberOfPayments - actualLoanAmount

		return {
			apartmentPrice,
			maxLoanAmount,
			actualLoanAmount,
			actualAsset,
			assetRatio: Math.min(100, Math.max(0, assetRatio)),
			loanRatio: Math.min(100, Math.max(0, loanRatio)),
			monthlyPayment,
			totalInterest,
			ltvPercent: Math.round(ltvRate * 100),
		}
	}, [asset, record.price_in_hundred_million, ltvRate])

	// 금액 포맷팅 함수들...
	const formatMoney = (amount: number) => {
		const hundredMillion = Math.floor(amount)
		const tenMillion = Math.floor((amount - hundredMillion) * 10)

		if (hundredMillion === 0) {
			return `${tenMillion}만원`
		}
		if (tenMillion === 0) {
			return `${hundredMillion}억원`
		}
		return `${hundredMillion}억 ${tenMillion}만원`
	}

	const formatMonthly = (amount: number) => {
		return `${Math.round(amount / 10000)}만원`
	}

	const formatInterest = (amount: number) => {
		const hundredMillion = Math.floor(amount / 100000000)
		const tenMillion = Math.floor((amount % 100000000) / 10000000)

		if (hundredMillion === 0) {
			return `${tenMillion}만원`
		}
		if (tenMillion === 0) {
			return `${hundredMillion}억원`
		}
		return `${hundredMillion}억 ${tenMillion}만원`
	}

	const handleSliderChange = (value: number[]) => {
		const ratio = value[0] / 100
		const newAsset = Math.min(
			record.price_in_hundred_million,
			record.price_in_hundred_million * ratio,
		)
		setAsset(newAsset)
	}

	const handleCheckboxChange = (checked: boolean) => {
		setIsFirstTime(checked)
		// useMemo가 자동으로 재계산됨!
	}

	return (
		<div className="w-full space-y-4">
			{/* 헤더 */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-bold text-gray-900">대출계산기</h3>
					<p className="text-xs text-gray-500 mt-0.5">금융감독원 최저금리 기준</p>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox id="first-time" checked={isFirstTime} onCheckedChange={handleCheckboxChange} />
					<label htmlFor="first-time" className="text-sm text-gray-700 cursor-pointer">
						생애최초
					</label>
				</div>
			</div>

			{/* 자본금과 대출금 표시 */}
			<div className="flex items-center justify-between gap-4">
				<div className="flex-1">
					<p className="text-xs text-gray-500 mb-1">자본금</p>
					<p className="text-2xl font-bold text-purple-600">
						{formatMoney(calculations.actualAsset)}
					</p>
				</div>

				<div className="flex-1 text-right">
					<p className="text-xs text-gray-500 mb-1">대출금(전체의 {calculations.ltvPercent}%)</p>
					<p className="text-2xl font-bold text-green-600">
						{formatMoney(calculations.actualLoanAmount)}
					</p>
				</div>
			</div>

			{/* 슬라이더 */}
			<div className="relative py-4">
				<div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none z-0">
					<div className="relative h-2 w-full rounded-full overflow-hidden">
						<div
							className="absolute left-0 top-0 h-full bg-purple-500 transition-all duration-200"
							style={{ width: `${calculations.assetRatio}%` }}
						/>
						<div
							className="absolute right-0 top-0 h-full bg-green-500 transition-all duration-200"
							style={{ width: `${calculations.loanRatio}%` }}
						/>
					</div>
				</div>
				<Slider
					value={[calculations.assetRatio]}
					onValueChange={handleSliderChange}
					max={100}
					min={0}
					step={0.5}
					className="relative w-full z-10 [&>span]:bg-transparent [&>span>span]:bg-transparent [&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:border-purple-500 [&_[role=slider]]:shadow-lg [&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
				/>
			</div>

			{/* 계산 결과 */}
			<div className="space-y-2 pt-2 border-t border-gray-200">
				<p className="text-sm text-green-600">
					월납입금 {formatMonthly(calculations.monthlyPayment)} 20년간
				</p>
				<p className="text-sm text-green-600">
					이자총액 {formatInterest(calculations.totalInterest)}(원금균등분할상환)
				</p>
			</div>
		</div>
	)
}
