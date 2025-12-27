"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 기본적으로 5분간 캐시 유지
            staleTime: 1000 * 60 * 5,
            // 실패 시 3번 재시도
            retry: 3,
            // 재시도 간격은 지수 백오프
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // 윈도우 포커스 시 자동 리페치 비활성화 (필요시 활성화)
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

