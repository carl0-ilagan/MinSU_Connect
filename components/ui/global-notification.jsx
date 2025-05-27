"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, AlertCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function GlobalNotification() {
  const { toast, toasts } = useToast()
  const [visible, setVisible] = useState(false)
  const [currentToast, setCurrentToast] = useState(null)

  useEffect(() => {
    // Check if there's a new toast to display
    if (toasts.length > 0) {
      const latestToast = toasts[toasts.length - 1]
      setCurrentToast(latestToast)
      setVisible(true)

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [toasts])

  if (!visible || !currentToast) return null

  const getIcon = () => {
    if (currentToast.variant === "destructive") {
      return <AlertCircle className="h-5 w-5 text-white" />
    }
    return <CheckCircle2 className="h-5 w-5 text-white" />
  }

  const getBgColor = () => {
    if (currentToast.variant === "destructive") {
      return "bg-red-500"
    }
    return "bg-green-500"
  }

  return (
    <div
      className={`fixed top-14 md:top-16 left-0 right-0 z-50 mx-auto max-w-md px-4 animate-in slide-in-from-top-full`}
    >
      <div
        className={`${getBgColor()} text-white p-4 rounded-md shadow-lg flex items-center justify-between`}
        role="alert"
      >
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <p className="font-medium">{currentToast.title}</p>
            {currentToast.description && <p className="text-sm opacity-90">{currentToast.description}</p>}
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
