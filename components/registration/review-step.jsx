"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { XCircle, User, Mail, UserCircle, Heart, AlertTriangle, CheckCircle, GraduationCap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ReviewStep({ formData, updateFormData, errors }) {
  const handleAgreeChange = (checked) => {
    updateFormData({ agreeToTerms: checked })
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Review Your Information</h3>
        <p className="text-sm text-muted-foreground">Please review your information before completing registration</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Account Information
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">ID Number:</span>
                <p className="font-medium">{formData.idNumber}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{formData.email}</p>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Email Verification:</span>
              <div className="flex items-center gap-1 mt-1">
                {formData.isVerified ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-600 font-medium">Not Verified</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            Profile Information
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
            <div>
              <span className="text-muted-foreground">First Name:</span>
              <p className="font-medium">{formData.firstName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Name:</span>
              <p className="font-medium">{formData.lastName}</p>
            </div>
            {formData.photoURL && (
              <div>
                <span className="text-muted-foreground">Profile Picture:</span>
                <div className="h-10 w-10 rounded-full overflow-hidden mt-1 bg-gray-200">
                  <img
                    src={formData.photoURL || "/placeholder.svg"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            Academic Information
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
            <div>
              <span className="text-muted-foreground">Campus:</span>
              <p className="font-medium">{formData.campus || "Not specified"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Department/Program:</span>
              <p className="font-medium">{formData.department || "Not specified"}</p>
            </div>
          </div>
        </div>

        {formData.hobbies && formData.hobbies.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              Hobbies
            </h4>
            <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg">
              {formData.hobbies.map((hobby) => (
                <span
                  key={hobby}
                  className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                >
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={handleAgreeChange}
              className={errors.agreeToTerms ? "border-red-500" : ""}
            />
            <Label
              htmlFor="terms"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the Community Guidelines and Terms of Service
            </Label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> {errors.agreeToTerms}
            </p>
          )}
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Mail className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            By completing registration, you'll join the MINSU Connect community. You can update your profile information
            anytime from your account settings.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
