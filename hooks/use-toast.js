"use client"

import { createContext, useContext, useState } from "react"

const ToastContext = createContext({
  toast: () => {},
  toasts: [],
})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = ({ title, description, variant = "default", icon }) => {
    const id = Date.now().toString()
    const newToast = { id, title, description, variant, icon }
    setToasts((prev) => [...prev, newToast])

    // Remove toast after 6 seconds (slightly longer than the animation)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 6000)

    return id
  }

  return <ToastContext.Provider value={{ toast, toasts }}>{children}</ToastContext.Provider>
}

export const useToast = () => useContext(ToastContext)
