"use client"

import { MobileNav } from "@/components/navigation/mobile-nav"
import { usePathname } from "next/navigation"

export default function UserLayout({ children }) {
  const pathname = usePathname()
  const isMessagesPage = pathname.startsWith('/user/messages')

  return (
    <div className="min-h-screen bg-background">
      {children}
      {!isMessagesPage && <MobileNav />}
    </div>
  )
} 