import type { Metadata } from "next"
import { Noto_Sans_KR } from "next/font/google"
import "./globals.css"
import BottomNav from "@/components/layout/BottomNav"

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"], // Include Thin (100) and Light (300)
  variable: "--font-noto-sans-kr",
})

export const metadata: Metadata = {
  title: "아파트 임장 기록",
  description: "아파트 임장 정보를 기록하고 관리하는 앱",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.className} antialiased pb-16 font-light`}>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
