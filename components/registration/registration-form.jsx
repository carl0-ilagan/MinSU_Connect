"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AccountStep } from "./account-step"
import { VerificationStep } from "./verification-step"
import { ProfileStep } from "./profile-step"
import { HobbiesStep } from "./hobbies-step"
import { ReviewStep } from "./review-step"
import { StepIndicator } from "./step-indicator"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, AlertCircle, WifiOff } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AcademicInfoStep } from "./academic-info-step"
import { collection, query, where, getDocs } from "firebase/firestore"

export default function RegistrationForm({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [verificationSent, setVerificationSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [warningMessage, setWarningMessage] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    idNumber: "",
    password: "",
    isVerified: false,
    firstName: "",
    lastName: "",
    photoURL: null,
    department: "",
    campus: "",
    hobbies: [],
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState({})
  const { registerUserProfile } = useAuth()
  const { toast } = useToast()

  const steps = [
    { name: "Account", component: AccountStep },
    { name: "Verification", component: VerificationStep },
    { name: "Profile", component: ProfileStep },
    { name: "Academic", component: AcademicInfoStep },
    { name: "Hobbies", component: HobbiesStep },
    { name: "Review", component: ReviewStep },
  ]

  // Prevent direct navigation to user page if registration is not complete
  useEffect(() => {
    // Set a flag in sessionStorage to indicate registration is in progress
    if (!showSuccess) {
      sessionStorage.setItem("registrationInProgress", "true")
    } else {
      // Clear the flag when registration is complete
      sessionStorage.removeItem("registrationInProgress")
    }

    // Cleanup on unmount
    return () => {
      if (!showSuccess) {
        sessionStorage.removeItem("registrationInProgress")
      }
    }
  }, [showSuccess])

  const updateFormData = (newData) => {
    setFormData({ ...formData, ...newData })
  }

  // Check if ID number already exists
  const checkIdNumberExists = async (idNumber) => {
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("idNumber", "==", idNumber))
      const querySnapshot = await getDocs(q)
      return !querySnapshot.empty
    } catch (error) {
      console.error("Error checking ID number:", error)
      return false
    }
  }

  const validateStep = async () => {
    const newErrors = {}

    if (currentStep === 0) {
      // Account step validation
      if (!formData.idNumber) {
        newErrors.idNumber = "ID Number is required"
      } else if (!/^MBC\d{4}-\d{4}$/.test(formData.idNumber)) {
        newErrors.idNumber = "ID Number must be in format MBC2023-0000"
      } else {
        // Check if ID number already exists
        const idExists = await checkIdNumberExists(formData.idNumber)
        if (idExists) {
          newErrors.idNumber = "This ID Number is already registered"
        }
      }

      if (!formData.email) {
        newErrors.email = "Email is required"
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address"
      }

      if (!formData.password) {
        newErrors.password = "Password is required"
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters"
      }
    }

    if (currentStep === 1) {
      // Verification step validation
      if (!formData.isVerified) {
        newErrors.verification = "Email verification is required to continue"
      }
    }

    if (currentStep === 2) {
      // Profile step validation
      if (!formData.firstName) {
        newErrors.firstName = "First name is required"
      }
      if (!formData.lastName) {
        newErrors.lastName = "Last name is required"
      }
      if (!formData.photoURL) {
        newErrors.photoURL = "Profile picture is required"
      }
    }

    if (currentStep === 3) {
      // Academic info validation
      if (!formData.campus) {
        newErrors.campus = "Campus is required"
      }
      if (!formData.department) {
        newErrors.department = "Department is required"
      }
    }

    if (currentStep === 5) {
      // Review step validation
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = "You must agree to the terms to continue"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    setErrorMessage("")
    setWarningMessage("")

    const isValid = await validateStep()
    if (isValid) {
      if (currentStep === 0) {
        // Create Firebase user after account step
        try {
          setIsSubmitting(true)
          const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
          await sendEmailVerification(userCredential.user)
          setVerificationSent(true)
          setIsSubmitting(false)
          setCurrentStep(currentStep + 1)
          window.scrollTo(0, 0)
        } catch (error) {
          setIsSubmitting(false)
          console.error("Error creating user:", error)

          let errorMsg = "An error occurred during registration. Please try again."

          if (error.code === "auth/email-already-in-use") {
            errorMsg = "This email is already registered. Please use a different email or try logging in."
          } else if (error.code === "auth/invalid-email") {
            errorMsg = "The email address is not valid."
          } else if (error.code === "auth/weak-password") {
            errorMsg = "The password is too weak. Please choose a stronger password."
          } else if (error.code === "auth/network-request-failed") {
            errorMsg = "Network error. Please check your internet connection and try again."
          }

          setErrorMessage(errorMsg)
        }
      } else if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
        window.scrollTo(0, 0)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    setErrorMessage("")
    setWarningMessage("")
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    const isValid = await validateStep()
    if (isValid) {
      setIsSubmitting(true)
      setErrorMessage("")
      setWarningMessage("")

      try {
        console.log("Submitting registration with data:", {
          ...formData,
          photoURL: formData.photoURL ? "Base64 image included" : "No image",
        })

        // Register user profile in Firestore
        await registerUserProfile({
          idNumber: formData.idNumber,
          firstName: formData.firstName,
          lastName: formData.lastName,
          department: formData.department,
          campus: formData.campus,
          hobbies: formData.hobbies,
          photoURL: formData.photoURL, // Pass the photoURL directly
          useDefaultImage: false, // Explicitly tell the auth hook not to use a default image
        })

        // Show success message
        setShowSuccess(true)

        // Wait 2 seconds before completing
        setTimeout(() => {
          // Call the onComplete callback with user data
          if (onComplete) {
            onComplete({
              uid: auth.currentUser.uid,
              email: auth.currentUser.email,
              fullName: `${formData.firstName} ${formData.lastName}`,
              idNumber: formData.idNumber,
              department: formData.department,
              campus: formData.campus,
            })
          }
        }, 2000)
      } catch (error) {
        console.error("Registration error:", error)

        // Handle different types of errors
        if (error.code === "auth/network-request-failed") {
          // For network errors, show a warning but still allow completion
          setWarningMessage(
            "Your profile was saved, but we couldn't update your profile picture due to a network issue. You can update it later in your profile settings.",
          )

          // Show success message despite the warning
          setShowSuccess(true)

          // Wait 2 seconds before completing
          setTimeout(() => {
            // Call the onComplete callback with user data
            if (onComplete) {
              onComplete({
                uid: auth.currentUser.uid,
                email: auth.currentUser.email,
                fullName: `${formData.firstName} ${formData.lastName}`,
                idNumber: formData.idNumber,
                department: formData.department,
                campus: formData.campus,
              })
            }
          }, 2000)
        } else {
          // For other errors, show an error message
          setErrorMessage("An error occurred while saving your profile. Please try again.")
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <div className="px-6 py-4 font-manrope">
      {errorMessage && (
        <Alert variant="destructive" className="mb-6 border-red-400 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {warningMessage && (
        <Alert variant="warning" className="mb-6 border-yellow-400 bg-yellow-50">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Network Warning</AlertTitle>
          <AlertDescription>{warningMessage}</AlertDescription>
        </Alert>
      )}

      {showSuccess ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4 transition-opacity duration-500 opacity-100">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-green-700">Registration Successful!</h3>
          <p className="text-center text-muted-foreground">
            Welcome to MINSU Connect, {formData.firstName}! Your account has been created successfully.
          </p>
          <div className="mt-4 flex items-center justify-center transition-transform duration-300 transform scale-100">
            <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-green-200">
              {formData.photoURL ? (
                <img
                  src={formData.photoURL || "/placeholder.svg"}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-green-100 text-xl font-semibold text-green-600">
                  {formData.firstName.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <p className="font-medium text-green-600">
            {formData.firstName} {formData.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{formData.idNumber}</p>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            <p>Redirecting to your dashboard...</p>
            <div className="mt-3 flex justify-center">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 animate-progress"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <StepIndicator steps={steps.map((step) => step.name)} currentStep={currentStep} />

          <div className="mt-6 mb-8 transition-opacity duration-300">
            <CurrentStepComponent
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              verificationSent={verificationSent}
              setVerificationSent={setVerificationSent}
            />
          </div>

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="rounded-lg border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
            >
              Back
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={(currentStep === 1 && !formData.isVerified) || isSubmitting}
              className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  {currentStep === 0
                    ? "Creating Account..."
                    : currentStep === steps.length - 1
                      ? "Completing Registration..."
                      : "Processing..."}
                </>
              ) : currentStep === steps.length - 1 ? (
                "Complete Registration"
              ) : (
                "Next Step"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
