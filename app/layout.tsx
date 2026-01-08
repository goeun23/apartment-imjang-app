import type { Metadata } from "next"
import { Noto_Sans_KR } from "next/font/google"
import "./globals.css"
import BottomNav from "@/components/layout/BottomNav"
import { QueryProvider } from "@/lib/providers/QueryProvider"
import PushNotificationManager from "@/components/PushNotificationManager"

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"], // Include Thin (100) and Light (300)
  variable: "--font-noto-sans-kr",
})

export const metadata: Metadata = {
  title: {
    template: "%s | 아파트 임장 기록",
    default: "아파트 임장 기록",
  },
  description: "아파트 임장 정보를 기록하고 관리하는 앱",
  openGraph: {
    title: "아파트 임장 기록",
    description: "효율적인 아파트 임장 기록 관리 서비스",
    url: "https://imjang-app.vercel.app", // Example URL
    siteName: "아파트 임장 기록",
    images: [
      {
        url: "/og-image.png", // Assuming existence or placeholder
        width: 1200,
        height: 630,
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "아파트 임장 기록",
    description: "효율적인 아파트 임장 기록 관리 서비스",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.className} antialiased pb-16 font-light`}>
        <QueryProvider>
          {children}
          <BottomNav />
          <PushNotificationManager />
        </QueryProvider>
      </body>
    </html>
  )
}
