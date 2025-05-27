"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle, RefreshCw } from "lucide-react"
import { auth } from "@/lib/firebase"
import { sendEmailVerification } from "firebase/auth"

export function VerificationStep({ formData, updateFormData, errors }) {
  const [isChecking, setIsChecking] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [checkCount, setCheckCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)

  // Check verification status periodically
  useEffect(() => {
    const checkVerification = async () => {
      if (!auth.currentUser) return

      try {
        setIsChecking(true)
        // Reload user to get latest verification status
        await auth.currentUser.reload()

        if (auth.currentUser.emailVerified) {
          updateFormData({ isVerified: true })
        }
      } catch (error) {
        console.error("Error checking verification status:", error)
      } finally {
        setIsChecking(false)
      }
    }

    // Check immediately
    checkVerification()

    // Set up interval to check every 5 seconds
    const interval = setInterval(() => {
      checkVerification()
      setCheckCount((prev) => prev + 1)
    }, 5000)

    return () => clearInterval(interval)
  }, [updateFormData])

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft])

  const handleResendVerification = async () => {
    if (!auth.currentUser) return

    try {
      setIsResending(true)
      await sendEmailVerification(auth.currentUser)
      setTimeLeft(60) // Set cooldown to 60 seconds
    } catch (error) {
      console.error("Error resending verification email:", error)
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return

    try {
      setIsChecking(true)
      await auth.currentUser.reload()

      if (auth.currentUser.emailVerified) {
        updateFormData({ isVerified: true })
      }
    } catch (error) {
      console.error("Error checking verification status:", error)
    } finally {
      setIsChecking(false)
      setCheckCount((prev) => prev + 1)
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Verify Your Email</h3>
        <p className="text-sm text-muted-foreground">
          We've sent a verification link to <span className="font-medium">{formData.email}</span>
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <div className="rounded-full bg-green-100 p-4 mb-4">
          <Mail className="h-10 w-10 text-green-600" />
        </div>

        {formData.isVerified ? (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
              <CheckCircle className="h-5 w-5" />
              <span>Email Verified Successfully!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your email has been verified. You can now continue with your registration.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Please check your email</h4>
              <p className="text-sm text-muted-foreground">
                Click the verification link in the email we sent to{" "}
                <span className="font-medium">{formData.email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                After clicking the link, return here and click the button below to continue.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 mt-4">
              <Button
                type="button"
                onClick={handleCheckVerification}
                disabled={isChecking}
                className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 w-full"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    I've Verified My Email
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleResendVerification}
                disabled={isResending || timeLeft > 0}
                className="rounded-lg border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : timeLeft > 0 ? (
                  `Resend in ${timeLeft}s`
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {checkCount > 3 && !formData.isVerified && (
        <Alert className="bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Don't see the email? Check your spam folder or try resending the verification email.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {errors.verification && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-700">{errors.verification}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
