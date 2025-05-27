"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, LogOut, User, Bell, Lock, Shield } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { LogoutConfirmationModal } from "@/components/logout-confirmation-modal"

  const tabs = [
  {
    id: "profile",
    label: "Profile",
    href: "/user/settings/profile",
    icon: User,
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/user/settings/notifications",
    icon: Bell,
  },
  {
    id: "security",
    label: "Security",
    href: "/user/settings/security",
    icon: Lock,
  },
]

export function SettingsLayout({ children }) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const activeTab = tabs.find((tab) => pathname?.includes(tab.id))?.id || "profile"

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

  return (
    <div className="grid gap-6 md:grid-cols-[250px_1fr]">
      <div className="hidden md:block">
        <Card className="rounded-xl shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Settings</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="flex flex-col">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-muted rounded-lg mx-2 my-1 ${
                    activeTab === tab.id ? "bg-primary/10 text-primary font-medium" : ""
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              ))}
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-4 py-3 text-sm justify-start rounded-lg mx-2 my-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowLogoutConfirmation(true)}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </nav>
          </CardContent>
        </Card>
      </div>

      <div className="md:hidden mb-6">
        <Card className="rounded-xl shadow-md border-0">
          <CardHeader className="p-4">
            <CardTitle className="text-xl font-bold">Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav>
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center justify-between px-4 py-3 text-sm border-b ${
                    activeTab === tab.id ? "bg-primary/10 text-primary font-medium" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between px-4 py-3 text-sm rounded-none text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowLogoutConfirmation(true)}
              >
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          </CardContent>
        </Card>
      </div>

      {children}

      <LogoutConfirmationModal
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </div>
  )
}
