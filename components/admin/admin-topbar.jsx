"use client"

import { useState, useEffect } from "react"
import { Bell, Search, User, Settings, LogOut, Shield, Menu, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function AdminTopbar({ sidebarCollapsed, setSidebarCollapsed }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = () => {
    setIsLoggingOut(true)

    // Simulate API call for logout
    setTimeout(() => {
      // Clear admin auth from localStorage and sessionStorage
      localStorage.removeItem("adminAuth")
      sessionStorage.removeItem("adminAuth")

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin panel",
      })

      // Redirect to welcome page
      router.push("/welcome")
    }, 1500) // Simulate a 1.5 second logout process
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full border-b transition-all duration-200 ${
          isScrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-background"
        }`}
      >
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notification Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">3</Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                  <NotificationItem
                    title="New User Registration"
                    description="John Doe has registered and is awaiting approval"
                    time="5 minutes ago"
                    type="user"
                  />
                  <NotificationItem
                    title="Post Reported"
                    description="A post has been reported for inappropriate content"
                    time="20 minutes ago"
                    type="alert"
                  />
                  <NotificationItem
                    title="New Post Pending"
                    description="There are 5 new posts awaiting moderation"
                    time="1 hour ago"
                    type="post"
                  />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer justify-center font-medium text-primary">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 p-0">
                  <Avatar className="h-8 w-8 border-2 border-primary/20">
                    <AvatarImage src="/admin-avatar.png" alt="Admin" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Shield className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/")}>
                  <User className="mr-2 h-4 w-4" />
                  View Main Site
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowLogoutConfirmation(true)}
                  className="text-red-500 focus:text-red-500"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-border bg-background absolute top-16 left-0 right-0 z-20">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start" onClick={() => router.push("/admin/dashboard")}>
                  <Shield className="h-4 w-4 mr-2" /> Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/admin/user-approvals")}
                >
                  <Shield className="h-4 w-4 mr-2" /> User Approvals
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => router.push("/admin/users")}>
                  <Shield className="h-4 w-4 mr-2" /> User Management
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => router.push("/admin/posts")}>
                  <Shield className="h-4 w-4 mr-2" /> Post Moderation
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutConfirmation} onOpenChange={setShowLogoutConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Confirm Logout</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to log out of the admin panel? You will need to log in again to access the admin
              features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLogoutConfirmation(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Yes, Log Out"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function NotificationItem({ title, description, time, type }) {
  const getIcon = () => {
    switch (type) {
      case "user":
        return (
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            <AvatarFallback className="bg-blue-100 text-blue-600">U</AvatarFallback>
          </Avatar>
        )
      case "post":
        return (
          <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
        )
      case "alert":
        return (
          <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
            <Bell className="h-5 w-5 text-red-600" />
          </div>
        )
      default:
        return (
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
        )
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors">
      {getIcon()}
      <div className="flex-1 space-y-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  )
}
