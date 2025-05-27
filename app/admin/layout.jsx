"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import "../globals.css"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { Home, Users, FileText, MessageSquare } from "lucide-react"

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isAccessDenied, setIsAccessDenied] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAdmin, loading } = useAuth()

  // Pages that don't require authentication
  const publicPages = ["/admin/register"]

  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    // Wait for auth to initialize
    if (loading) return

    // Check if user is authenticated as admin
    const adminAuth = localStorage.getItem("adminAuth") || sessionStorage.getItem("adminAuth")

    if ((!adminAuth || !isAdmin) && !isPublicPage) {
      // If not admin, show access denied
      setIsAccessDenied(true)
      setIsAuthenticated(false)
    } else {
      setIsAuthenticated(true)
      setIsAccessDenied(false)
    }

    setIsLoading(false)
  }, [pathname, router, isPublicPage, loading, isAdmin, user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // For public pages like registration, show without admin layout
  if (isPublicPage) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  // If access is denied, show access denied page
  if (isAccessDenied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <ShieldAlert className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this area. This section is restricted to administrators only.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => router.push("/user")}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              Go to User Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/welcome")}
              className="w-full border-green-500 text-green-600 hover:bg-green-50"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If not authenticated and not a public page, don't render (will redirect in useEffect)
  if (!isAuthenticated && !isPublicPage) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}>
        <nav className="space-y-1">
          <Link href="/admin/dashboard" className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-700">
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-700">
            <Users className="mr-3 h-5 w-5" />
            Users
          </Link>
          <Link href="/admin/posts" className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-700">
            <FileText className="mr-3 h-5 w-5" />
            Posts
          </Link>
          <Link href="/admin/feedback" className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-700">
            <MessageSquare className="mr-3 h-5 w-5" />
            Feedback & Support
          </Link>
        </nav>
      </AdminSidebar>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-[250px]"
        }`}
      >
        <AdminTopbar sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
        <main className="px-4 py-0 pt-2 w-full">{children}</main>
      </div>
    </div>
  )
}
