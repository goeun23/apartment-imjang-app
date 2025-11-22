"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ClipboardList, TrendingUp, Calculator } from "lucide-react"

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "홈", icon: Home },
    { href: "/records", label: "기록", icon: ClipboardList },
    { href: "/market-price", label: "시세", icon: TrendingUp },
    { href: "/loan-calculator", label: "대출", icon: Calculator },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon
                className={`w-6 h-6 mb-1 ${
                  isActive ? "stroke-2" : "stroke-1.5"
                }`}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
