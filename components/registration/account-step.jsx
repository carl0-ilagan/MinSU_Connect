"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, XCircle, Mail, Lock, User, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AccountStep({ formData, updateFormData, errors }) {
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState("")
  const [password, setPassword] = useState("") // Declare the password variable

  const handleEmailChange = (e) => {
    updateFormData({ email: e.target.value })
  }

  const handleIdNumberChange = (e) => {
    updateFormData({ idNumber: e.target.value })
  }

  const handlePasswordChange = (e) => {
    const passwordValue = e.target.value
    updateFormData({ password: passwordValue })
    calculatePasswordStrength(passwordValue)
    setPassword(passwordValue) // Update the password state
  }

  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(0)
      setPasswordFeedback("")
      return
    }

    let strength = 0
    let feedback = ""

    // Length check
    if (password.length >= 8) {
      strength += 25
    }

    // Contains uppercase
    if (/[A-Z]/.test(password)) {
      strength += 25
    }

    // Contains number
    if (/[0-9]/.test(password)) {
      strength += 25
    }

    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 25
    }

    // Set feedback based on strength
    if (strength <= 25) {
      feedback = "Weak password"
    } else if (strength <= 50) {
      feedback = "Fair password"
    } else if (strength <= 75) {
      feedback = "Good password"
    } else {
      feedback = "Strong password"
    }

    setPasswordStrength(strength)
    setPasswordFeedback(feedback)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-red-500"
    if (passwordStrength <= 50) return "bg-yellow-500"
    if (passwordStrength <= 75) return "bg-green-400"
    return "bg-green-600"
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-right">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold font-manrope">Account Information</h3>
        <p className="text-sm text-muted-foreground font-manrope">Create your account credentials</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="idNumber" className="flex items-center gap-2 text-sm font-medium font-manrope">
            <User className="h-4 w-4 text-green-600" />
            ID Number
          </Label>
          <Input
            id="idNumber"
            placeholder="MBC2022-0426"
            value={formData.idNumber || ""}
            onChange={handleIdNumberChange}
            className={`rounded-lg transition-all focus:ring-2 focus:ring-green-500/20 font-manrope ${
              errors.idNumber ? "border-red-500 focus:ring-red-200" : ""
            }`}
          />
          {errors.idNumber && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-manrope">
              <XCircle className="h-3 w-3" /> {errors.idNumber}
            </p>
          )}
          <p className="text-xs text-muted-foreground font-manrope">
            Your ID number must be in the format MBC2022-0426
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium font-manrope">
            <Mail className="h-4 w-4 text-green-600" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email || ""}
            onChange={handleEmailChange}
            className={`rounded-lg transition-all focus:ring-2 focus:ring-green-500/20 font-manrope ${
              errors.email ? "border-red-500 focus:ring-red-200" : ""
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-manrope">
              <XCircle className="h-3 w-3" /> {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium font-manrope">
            <Lock className="h-4 w-4 text-green-600" />
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password || ""}
              onChange={handlePasswordChange}
              className={`rounded-lg pr-10 transition-all focus:ring-2 focus:ring-green-500/20 font-manrope ${
                errors.password ? "border-red-500 focus:ring-red-200" : ""
              }`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-manrope">
              <XCircle className="h-3 w-3" /> {errors.password}
            </p>
          )}

          {formData.password && (
            <div className="space-y-1 mt-2">
              <div className="flex justify-between items-center">
                <Progress value={passwordStrength} className="h-1.5 w-full bg-gray-200">
                  <div
                    className={`h-full ${getStrengthColor()} transition-all duration-300`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </Progress>
                <span
                  className={`ml-2 text-xs font-medium font-manrope ${
                    passwordStrength <= 25
                      ? "text-red-500"
                      : passwordStrength <= 50
                        ? "text-yellow-500"
                        : passwordStrength <= 75
                          ? "text-green-500"
                          : "text-green-600"
                  }`}
                >
                  {passwordFeedback}
                </span>
              </div>

              <ul className="space-y-1 text-xs text-muted-foreground font-manrope">
                <li className="flex items-center gap-1">
                  {password.length >= 8 ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                  )}
                  At least 8 characters
                </li>
                <li className="flex items-center gap-1">
                  {/[A-Z]/.test(password) ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                  )}
                  Contains uppercase letter
                </li>
                <li className="flex items-center gap-1">
                  {/[0-9]/.test(password) ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                  )}
                  Contains number
                </li>
                <li className="flex items-center gap-1">
                  {/[^A-Za-z0-9]/.test(password) ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                  )}
                  Contains special character
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
