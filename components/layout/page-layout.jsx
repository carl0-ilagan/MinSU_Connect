"use client"

import { useState, useEffect } from "react"
import { DesktopNav } from "@/components/navigation/desktop-nav"
import { MobileNav } from "@/components/navigation/mobile-nav"

export function PageLayout({ children }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check on mount
    handleResize()

    // Listen for window resize events
    window.addEventListener("resize", handleResize)

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? <MobileNav /> : <DesktopNav />}
      <div className={`container mx-auto px-3 sm:px-4 pt-4 pb-24 md:pt-4 md:pb-16 max-w-7xl ${isMobile ? "mt-4" : ""}`}>
        {children}
      </div>
    </div>
  )
}
