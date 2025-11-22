"use client"

import { useState } from "react"
import { saveLoanCalculation } from "@/lib/services/loanService"

interface LoanResult {
  maxLoanAmount: number
  downPayment: number
  additionalFundNeeded: number
  monthlyPayment: number
}

export default function LoanCalculatorPage() {
  const [currentAsset, setCurrentAsset] = useState("")
  const [apartmentPrice, setApartmentPrice] = useState("")
  const [ltvRate, setLtvRate] = useState<40 | 70>(70)
  const [result, setResult] = useState<LoanResult | null>(null)

  const calculateLoan = () => {
    const asset = parseFloat(currentAsset) || 0
    const price = parseFloat(apartmentPrice) || 0

    if (price === 0) {
      alert("아파트 금액을 입력해주세요")
      return
    }

    const ltvRateDecimal = ltvRate / 100
    const maxLoanAmount = price * ltvRateDecimal
    const downPayment = price - maxLoanAmount
    const additionalFundNeeded = Math.max(0, downPayment - asset)

    // 월 상환액 (원리금균등, 30년, 이자율 4% 가정)
    const monthlyInterestRate = 0.04 / 12
    const numberOfPayments = 30 * 12
    const monthlyPayment =
      (maxLoanAmount *
        (monthlyInterestRate *
          Math.pow(1 + monthlyInterestRate, numberOfPayments))) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)

    setResult({
      maxLoanAmount,
      downPayment,
      additionalFundNeeded,
      monthlyPayment,
    })

    // Save to DB
    saveLoanCalculation(asset, price, ltvRate, maxLoanAmount).catch((err) => {
      console.error("Failed to save calculation:", err)
      // Don't alert user, just log it as it's a background action
    })
  }

  const formatNumber = (num: number) => {
    return num.toFixed(2)
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary-600 text-white px-4 py-6">
        <h1 className="text-2xl font-bold">대출 계산기</h1>
        <p className="text-primary-100 text-sm mt-1">
          LTV 규제를 반영한 대출 가능 금액을 계산하세요
        </p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 현재 자산 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            현재 자산 (억)
          </label>
          <input
            type="number"
            step="0.1"
            value={currentAsset}
            onChange={(e) => setCurrentAsset(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="예: 3.5"
          />
        </div>

        {/* 아파트 금액 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            아파트 금액 (억)
          </label>
          <input
            type="number"
            step="0.1"
            value={apartmentPrice}
            onChange={(e) => setApartmentPrice(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="예: 15.5"
          />
        </div>

        {/* LTV 규제지역 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            LTV 규제지역
          </label>
          <div className="flex gap-3">
            {(
              [
                { value: 70, label: "비규제 (70%)" },
                { value: 40, label: "규제지역 (40%)" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLtvRate(option.value)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  ltvRate === option.value
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-primary-500"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 계산하기 버튼 */}
        <button
          onClick={calculateLoan}
          className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md"
        >
          계산하기
        </button>

        {/* 계산 결과 */}
        {result && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">계산 결과</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">최대 대출 가능 금액</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatNumber(result.maxLoanAmount)}억
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">필요 자기자본</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatNumber(result.downPayment)}억
                </span>
              </div>

              {result.additionalFundNeeded > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">추가 필요 자금</span>
                  <span className="text-lg font-semibold text-red-600">
                    {formatNumber(result.additionalFundNeeded)}억
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-600">
                  월 상환액 <span className="text-xs">(30년, 4%)</span>
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatNumber(result.monthlyPayment / 10000)}만원
                </span>
              </div>
            </div>

            {result.additionalFundNeeded > 0 ? (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ 현재 자산으로는 부족합니다. 추가로{" "}
                  <strong>{formatNumber(result.additionalFundNeeded)}억</strong>
                  이 필요합니다.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ 현재 자산으로 구매 가능합니다!
                </p>
              </div>
            )}
          </div>
        )}

        {/* 안내 사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2">
            💡 <strong>계산 기준</strong>
          </p>
          <ul className="text-xs text-blue-700 space-y-1 ml-4">
            <li>• 대출 이자율: 연 4% (고정금리 가정)</li>
            <li>• 대출 기간: 30년 (원리금균등상환)</li>
            <li>• LTV 비율: 규제지역 40%, 비규제 70%</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
