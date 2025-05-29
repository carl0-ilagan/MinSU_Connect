"use client"
import Link from "next/link"
import Image from "next/image"
import { Home, MessageSquare, PlusSquare, User, Search, PlusCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { ProfileDropdown } from "@/components/navigation/profile-dropdown"
import { FriendRequestDropdown } from "@/components/navigation/friend-request-dropdown"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import NotificationDropdown from "./notification-dropdown"
import { UserSearch } from "@/components/search/user-search"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { MobileSearch } from "@/components/search/mobile-search"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { Badge } from "@/components/ui/badge"

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { unreadCount, loading: unreadLoading } = useUnreadMessages()

  const navItems = [
    {
      name: "Home",
      href: "/user",
      icon: Home,
    },
    {
      name: "Create",
      href: "/user/create",
      icon: PlusCircle,
    },
    {
      name: "My Posts",
      href: "/user/my-posts",
      icon: FileText,
    },
    {
      name: "Messages",
      href: "/user/messages",
      icon: MessageSquare,
    },
  ]

  // Function to check if a path is active
  const isActive = (path) => {
    if (path === "/user" && pathname === "/user") {
      return true
    }
    if (path !== "/user" && pathname.startsWith(path)) {
      return true
    }
    return false
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show navigation when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true)
      } else {
        // Hide navigation when scrolling down
        setIsVisible(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll, { passive: true })

    // Cleanup
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  return (
    <>
      {/* Top header for mobile */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border h-14 px-3 flex items-center justify-between md:hidden shadow-sm">
        <Link href="/user" className="flex items-center gap-2 flex-shrink-0">
          <Image src="/MINSU.png" alt="Mindoro State University" width={32} height={32} className="rounded-full" />
          <span className="font-bold text-xl">
            <span className="text-yellow-500">MINSU</span>
            <span className="text-green-600">Connect</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Mobile Search */}
          <MobileSearch />

          {/* Friend Requests */}
          <FriendRequestDropdown />

          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </nav>

      {/* Bottom navigation for mobile */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-background border-t">
          <div className="grid grid-cols-4 h-16">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              if (item.href === "/user/messages") {
                return (
        <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 text-sm font-medium transition-colors relative",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    )}
        >
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs">{item.name}</span>
                    {!unreadLoading && unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold leading-none rounded-full">
                        {unreadCount}
                      </Badge>
                    )}
        </Link>
                )
              } else {
                return (
        <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 text-sm font-medium transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    )}
        >
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs">{item.name}</span>
        </Link>
                )
              }
            })}
          </div>
        </div>
      </div>
    </>
  )
}
