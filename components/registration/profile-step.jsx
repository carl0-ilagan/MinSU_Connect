"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Trash2, Loader2, AlertCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ProfileStep({ formData, updateFormData, errors }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    updateFormData({ [name]: value })
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file")
      return
    }

    setIsUploading(true)
    setUploadError("")

    try {
      // Convert file to base64 for storage in Firestore
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target.result
        console.log("Image converted to base64 successfully")
        console.log("Base64 string starts with:", base64String.substring(0, 50) + "...")

        // Store the base64 string directly in formData
        updateFormData({
          photoURL: base64String,
        })
        setIsUploading(false)
      }
      reader.onerror = () => {
        console.error("Error reading file")
        setUploadError("Failed to process image. Please try again.")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading image:", error)
      setUploadError("Failed to upload image. Please try again.")
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const removeAvatar = () => {
    updateFormData({ photoURL: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase()
    }
    return "U"
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Profile Details</h3>
        <p className="text-sm text-muted-foreground">Tell us more about yourself</p>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-4">
          <Avatar className="h-24 w-24 border-2 border-primary/20">
            {formData.photoURL ? (
              <AvatarImage src={formData.photoURL || "/placeholder.svg"} alt="Profile" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-lg">{getInitials()}</AvatarFallback>
            )}
          </Avatar>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="absolute bottom-0 right-0 rounded-full h-8 w-8"
            onClick={triggerFileInput}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </Button>
        </div>
        {formData.photoURL && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-destructive hover:text-destructive"
            onClick={removeAvatar}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove photo
          </Button>
        )}
        {uploadError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        {errors.photoURL && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> {errors.photoURL}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Upload a profile picture (max 10MB) <span className="text-red-500">*</span>
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName || ""}
              onChange={handleChange}
              placeholder="John"
              required
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> {errors.firstName}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName || ""}
              onChange={handleChange}
              placeholder="Doe"
              required
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> {errors.lastName}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
