"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import RegistrationForm from "@/components/registration/registration-form"
import { WelcomeModal } from "@/components/welcome-modal"
import { useAuth } from "@/hooks/use-auth"
import Script from "next/script"

export default function RegisterPage() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [userData, setUserData] = useState(null)
  const router = useRouter()
  const { user } = useAuth()

  // If user is already logged in and registration is complete, redirect to user page
  useEffect(() => {
    const registrationComplete = localStorage.getItem("registrationComplete")
    const registrationInProgress = sessionStorage.getItem("registrationInProgress")

    if (user) {
      if (registrationComplete === "true" && !showWelcomeModal) {
        router.push("/user")
      } else if (registrationInProgress === "true") {
        // If registration is in progress, stay on this page
        console.log("Registration in progress, staying on register page")
      } else if (!showWelcomeModal) {
        // If we're not sure, check if the user has a profile in Firestore
        // This is handled by the useAuth hook
        console.log("User is logged in but registration status is unknown")
      }
    }
  }, [user, router, showWelcomeModal])

  const handleRegistrationComplete = (userData) => {
    console.log("Registration complete, showing welcome modal", userData)
    setUserData(userData)
    setShowWelcomeModal(true)
  }

  const handleModalClose = () => {
    console.log("Modal closed, redirecting to user page")
    setShowWelcomeModal(false)
    router.push("/user")
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-emerald-100">
      <Script src="https://cdn.jsdelivr.net/npm/tesseract.js@4.0.2/dist/tesseract.min.js" strategy="beforeInteractive" />
      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-green-300/20 to-emerald-400/20 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-emerald-300/20 to-green-400/20 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4"></div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-8 flex-1 flex flex-col justify-center relative z-10">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 w-fit rounded-full hover:bg-white/50"
          onClick={() => router.push("/welcome")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="rounded-xl shadow-xl border-0 overflow-hidden animate-in bg-white/95 backdrop-blur-sm">
          <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
          <CardHeader className="space-y-1 pb-2">
            <div className="flex justify-center mb-2">
              <Image src="/MINSU.png" alt="Mindoro State University" width={70} height={70} className="rounded-full" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Create Your Account</CardTitle>
            <CardDescription className="text-center">
              Join the MINSU Connect community to connect with fellow students and faculty
            </CardDescription>
          </CardHeader>

          <RegistrationForm onComplete={handleRegistrationComplete} />

          <CardFooter className="flex flex-col space-y-4 pt-0">
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleModalClose}
        type="register"
        userName={userData?.fullName || "New User"}
      />
    </div>
  )
}
