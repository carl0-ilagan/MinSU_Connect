"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Shield,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  LogOut,
  Menu,
  X,
  MessageSquare,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { LogoutConfirmationModal } from "@/components/logout-confirmation-modal"

export function AdminSidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setCollapsed(true)
      }
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [setCollapsed])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
    localStorage.removeItem("adminAuth")
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin panel",
    })
    router.push("/login")
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

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen)
  }

  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/admin/dashboard",
    },
    {
      title: "User Management",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users",
    },
    {
      title: "Post Moderation",
      icon: <FileText className="h-5 w-5" />,
      href: "/admin/posts",
    },
    {
      title: "Reports",
      icon: <AlertTriangle className="h-5 w-5" />,
      href: "/admin/reports",
    },
    {
      title: "Feedback & Support",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/admin/feedback",
    },
    {
      title: "Notifications",
      icon: <Bell className="h-5 w-5" />,
      href: "/admin/notifications",
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/admin/settings",
    },
  ]

  // Mobile sidebar overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-50 lg:hidden" onClick={toggleMobileSidebar}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile sidebar */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
            mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={toggleMobileSidebar}
        ></div>

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-background transition-all duration-300 lg:relative ${
            collapsed ? "w-20" : "w-64"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Image src="/MINSU.png" alt="Mindoro State University" width={32} height={32} className="rounded-full" />
              {!collapsed && (
                <span className="font-bold text-xl">
                  <span className="text-yellow-500">MINSU</span>
                  <span className="text-green-600">Connect</span>
                </span>
              )}
            </Link>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={toggleMobileSidebar}>
                <X className="h-5 w-5" />
              </Button>
            )}
            </div>

          <nav className="flex-1 space-y-1 p-4">
                {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        pathname === item.href
                    ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                }`}
                    >
                        {item.icon}
                {!collapsed && <span>{item.title}</span>}
                  </Link>
                ))}
              </nav>

            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => setShowLogoutConfirmation(true)}
              >
              <div className={`flex items-center ${collapsed ? "justify-center w-full" : ""}`}>
                  <LogOut className="h-5 w-5" />
                {!collapsed && <span className="ml-3">Logout</span>}
                </div>
              </Button>
          </div>

          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-20 -right-4 h-8 w-8 rounded-full border bg-background shadow-md"
              onClick={toggleSidebar}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </aside>

        <LogoutConfirmationModal
          isOpen={showLogoutConfirmation}
          onClose={() => setShowLogoutConfirmation(false)}
          onConfirm={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      </>
    )
  }

  // Desktop sidebar
  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-background border-r border-border shadow-sm transition-all duration-300 ${
        collapsed ? "w-[70px]" : "w-[250px]"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center px-4 border-b">
          <div className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-2"}`}>
            <div className="flex items-center justify-center">
              <Image src="/MINSU.png" alt="MINSU Logo" width={36} height={36} className="rounded-full" />
            </div>
            {!collapsed && <span className="font-bold text-xl">MINSU Admin</span>}
          </div>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg mb-1 ${
                    pathname === item.href
                      ? "bg-primary/10 text-primary font-medium hover:bg-primary/20"
                      : "hover:bg-muted"
                  } ${collapsed ? "px-3" : "px-4"}`}
                >
                  <div className={`flex items-center ${collapsed ? "justify-center w-full" : ""}`}>
                    {item.icon}
                    {!collapsed && <span className="ml-3">{item.title}</span>}
                  </div>
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => setShowLogoutConfirmation(true)}
          >
            <div className={`flex items-center ${collapsed ? "justify-center w-full" : ""}`}>
              <LogOut className="h-5 w-5" />
              {!collapsed && <span className="ml-3">Logout</span>}
            </div>
          </Button>
        </div>

        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-20 -right-4 h-8 w-8 rounded-full border bg-background shadow-md"
            onClick={toggleSidebar}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <LogoutConfirmationModal
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </aside>
  )
}
