"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User, Shield, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { LogoutConfirmationModal } from "@/components/logout-confirmation-modal"

export function ProfileDropdown() {
  const { user, userData, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })
      router.push("/welcome")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
      setShowLogoutConfirmation(false)
    }
  }

  const isAdmin = userData?.role === "admin" || user?.email?.includes("admin") || user?.email?.includes("staff")

  return (
    <>
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
          <Avatar className="h-8 w-8">
              <AvatarImage src={userData?.photoURL || user?.photoURL} alt={userData?.displayName || user?.displayName} />
              <AvatarFallback>
                {userData?.firstName?.[0] || userData?.lastName?.[0] || user?.displayName?.[0] || "U"}
              </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/user/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
                Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/user/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
                Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/user/feedback" className="cursor-pointer">
              <MessageSquare className="mr-2 h-4 w-4" />
                Feedback & Support
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 cursor-pointer"
            onClick={() => setShowLogoutConfirmation(true)}
          >
          <LogOut className="mr-2 h-4 w-4" />
            Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

      <LogoutConfirmationModal
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  )
}
