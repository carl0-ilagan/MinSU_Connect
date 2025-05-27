"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  X,
  LogIn,
  UserPlus,
  BarChartIcon as ChartBar,
  Users,
  FileText,
  Bell,
  Settings,
  MessageSquare,
  Loader2,
} from "lucide-react"

export function WelcomeModal({ isOpen, onClose, type = "login", userName = "there" }) {
  const [showModal, setShowModal] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingButton, setLoadingButton] = useState("")
  const router = useRouter()

  useEffect(() => {
    setShowModal(isOpen)
    if (isOpen) {
      setAnimationComplete(false)
      const timer = setTimeout(() => {
        setAnimationComplete(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleClose = () => {
    console.log("Modal close button clicked")
    setShowModal(false)
    if (onClose) {
      console.log("Calling onClose callback")
      onClose()
    } else {
      console.log("No onClose callback provided, redirecting directly")
      redirectToPage()
    }
  }

  const redirectToPage = () => {
    const destination = type === "admin" ? "/admin/dashboard" : "/user"
    console.log("Redirecting to:", destination)
    router.push(destination)
  }

  const handleButtonClick = (buttonType) => {
    setIsLoading(true)
    setLoadingButton(buttonType)

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false)
      setLoadingButton("")
      handleClose()
    }, 1000)
  }

  // Auto-redirect after 5 seconds if modal is still open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        console.log("Auto-redirecting after timeout")
        handleClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
    <Dialog
      open={showModal}
      onOpenChange={(open) => {
        console.log("Dialog open state changed to:", open)
        if (!open) handleClose()
        setShowModal(open)
      }}
    >
      <DialogContent className="sm:max-w-md rounded-xl animate-in slide-up-fade">
        <DialogHeader>
          <div className="mx-auto mb-4">
            <Image src="/MINSU.png" alt="Mindoro State University" width={70} height={70} className="rounded-full" />
          </div>
          <DialogTitle className="text-2xl text-center">
            {type === "admin"
              ? "Welcome to Admin Panel"
              : type === "login"
                ? "Welcome Back!"
                : "Welcome to MINSU Connect!"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {type === "admin"
              ? `Hello, ${userName}! You're logged in as an administrator.`
              : type === "login"
                ? `Great to see you again, ${userName}!`
                : `We're excited to have you join our community, ${userName}!`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-6">
          <div className="relative h-24 w-24 flex items-center justify-center">
            {/* Background circle */}
            <div className="absolute inset-0 rounded-full bg-green-100"></div>

            {/* Icon based on type */}
            {type === "admin" ? (
              <div
                className={`transition-all duration-1000 ${animationComplete ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
              >
                <ChartBar className="h-12 w-12 text-primary" />
              </div>
            ) : type === "login" ? (
              <div
                className={`transition-all duration-1000 ${animationComplete ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
              >
                <LogIn className="h-12 w-12 text-primary" />
              </div>
            ) : (
              <div
                className={`transition-all duration-1000 ${animationComplete ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
              >
                <UserPlus className="h-12 w-12 text-primary" />
              </div>
            )}

            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse"></div>
          </div>
        </div>

        <div className="space-y-4">
          {type === "admin" ? (
            <div className="space-y-2">
              <p className="text-center text-muted-foreground">Here's what you can manage today:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChartBar className="h-3 w-3 text-primary" />
                  </div>
                  <span>View dashboard analytics and key metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="h-3 w-3 text-primary" />
                  </div>
                  <span>Manage user accounts and approvals</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="h-3 w-3 text-primary" />
                  </div>
                  <span>Review and moderate community posts</span>
                </li>
              </ul>
            </div>
          ) : type === "login" ? (
            <div className="space-y-2">
              <p className="text-center text-muted-foreground">Here's what's new since your last visit:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="h-3 w-3 text-primary" />
                  </div>
                  <span>New community posts waiting for your engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="h-3 w-3 text-primary" />
                  </div>
                  <span>Your previous posts have received new comments</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="h-3 w-3 text-primary" />
                  </div>
                  <span>Updated community guidelines to review</span>
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-center text-muted-foreground">Here are some things you can do to get started:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Settings className="h-3 w-3 text-primary" />
                  </div>
                  <span>Complete your profile to connect with others</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="h-3 w-3 text-primary" />
                  </div>
                  <span>Create your first post to share with the community</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="h-3 w-3 text-primary" />
                  </div>
                  <span>Explore posts from other community members</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleButtonClick("main")}
            className="rounded-full sm:order-1 sm:ml-2"
            disabled={isLoading}
          >
            {isLoading && loadingButton === "main" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : type === "admin" ? (
              "Go to Dashboard"
            ) : type === "login" ? (
              "Go to Feed"
            ) : (
              "Start Exploring"
            )}
          </Button>

          {type === "admin" ? (
            <Button
              variant="ghost"
              onClick={() => handleButtonClick("secondary")}
              className="rounded-full sm:order-0"
              disabled={isLoading}
            >
              {isLoading && loadingButton === "secondary" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "View User Approvals"
              )}
            </Button>
          ) : type === "login" ? (
            <Button
              variant="ghost"
              onClick={() => handleButtonClick("secondary")}
              className="rounded-full sm:order-0"
              disabled={isLoading}
            >
              {isLoading && loadingButton === "secondary" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "View Notifications"
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => handleButtonClick("secondary")}
              className="rounded-full sm:order-0"
              disabled={isLoading}
            >
              {isLoading && loadingButton === "secondary" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Complete Your Profile"
              )}
            </Button>
          )}
        </DialogFooter>

        <button
          className="absolute top-4 right-4 rounded-full p-1 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={handleClose}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  )
}
