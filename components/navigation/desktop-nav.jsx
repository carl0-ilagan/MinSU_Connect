"use client"

import Link from "next/link"
import Image from "next/image"
import { Home, MessageSquare, User, PenSquare } from "lucide-react"
import { ProfileDropdown } from "./profile-dropdown"
import { FriendRequestDropdown } from "./friend-request-dropdown"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import NotificationDropdown from "./notification-dropdown"
import { UserSearch } from "@/components/search/user-search"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { Badge } from "@/components/ui/badge"

export function DesktopNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { unreadCount, loading: unreadLoading } = useUnreadMessages()

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Left side - Logo */}
        <div className="flex items-center gap-2">
          <Link href="/user" className="flex items-center gap-2">
            <Image src="/MINSU.png" alt="Mindoro State University" width={32} height={32} className="rounded-full" />
            <span className="font-bold">
              <span className="text-yellow-500">MINSU</span> <span className="text-green-500">Connect</span>
            </span>
          </Link>
        </div>

        {/* Center - Navigation */}
        <div className="flex-1 flex justify-center">
          <nav className="flex items-center space-x-8">
            <Link
              href="/user"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                isActive("/user") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/user/create"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                isActive("/user/create") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <PenSquare className="h-4 w-4" />
              <span>Create Post</span>
            </Link>
            <Link
              href="/user/my-posts"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                isActive("/user/my-posts") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <User className="h-4 w-4" />
              <span>My Posts</span>
            </Link>
            <Link
              href="/user/messages"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                isActive("/user/messages") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Messages</span>
              {!unreadLoading && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs font-bold leading-none rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </Link>
          </nav>
        </div>

        {/* Right side - Search, Notifications, etc. */}
        <div className="flex items-center justify-end space-x-4">
          <UserSearch />
          <FriendRequestDropdown />
          <NotificationDropdown />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}
