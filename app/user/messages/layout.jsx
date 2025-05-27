"use client"

import { usePathname } from "next/navigation"

export default function MessagesLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-screen">
        {children}
      </div>
    </div>
  )
} 