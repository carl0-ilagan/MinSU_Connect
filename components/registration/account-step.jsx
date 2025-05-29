"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, XCircle, Mail, Lock, User, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AccountStep({ formData, updateFormData, errors }) {
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState("")
  const [password, setPassword] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const [loadingOcr, setLoadingOcr] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [idCheckLoading, setIdCheckLoading] = useState(false)
  const [idCheckError, setIdCheckError] = useState("")

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
    setPassword(passwordValue)
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

  // Function to check Firestore for ID number existence
  async function checkIdNumberExists(idNumber) {
    try {
      setIdCheckLoading(true)
      setIdCheckError("")
      // Dynamically import Firestore to avoid SSR issues
      const { db } = await import("@/lib/firebase")
      const { collection, query, where, getDocs } = await import("firebase/firestore")
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("idNumber", "==", idNumber))
      const querySnapshot = await getDocs(q)
      setIdCheckLoading(false)
      return !querySnapshot.empty
    } catch (error) {
      setIdCheckLoading(false)
      setIdCheckError("Error checking ID number. Please try again.")
      return false
    }
  }

  const handleOpenCamera = async () => {
    setShowCamera(true)
    setCapturedImage(null)
    setIdCheckError("")
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    }
  }

  // Restore manual capture
  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return
    const context = canvasRef.current.getContext('2d')
    context.drawImage(videoRef.current, 0, 0, 320, 240)
    // Save image preview
    const imageDataUrl = canvasRef.current.toDataURL('image/png')
    setCapturedImage(imageDataUrl)
    setShowCamera(false)
    // Stop the camera
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
    }
    // Automatically run OCR
    setLoadingOcr(true)
    setIdCheckError("")
    try {
      await new Promise((resolve, reject) => {
        if (window.Tesseract) resolve()
        else {
          const timeout = setTimeout(() => reject(new Error('Tesseract.js failed to load within timeout.')), 10000)
          const interval = setInterval(() => {
            if (window.Tesseract) {
              clearTimeout(timeout)
              clearInterval(interval)
              resolve()
            }
          }, 100)
        }
      })
      window.Tesseract.recognize(
        imageDataUrl,
        'eng',
        { logger: m => console.log(m) }
      ).then(async ({ data: { text } }) => {
        console.log('Raw OCR output:', text)
        const patterns = [
          /(MBC|MMC|MCC)[\s\-\.]?\d{4}[\s\-\.]?\d{4,5}/i,
          /(M8C|M8C|MCC)[\s\-\.]?\d{4}[\s\-\.]?\d{4,5}/i
        ]
        let idNum = ''
        let match = null
        for (const pattern of patterns) {
          match = text.match(pattern)
          if (match) {
            idNum = match[0].replace(/\s+/g, '').replace(/\./g, '-').replace(/-/g, '-').toUpperCase()
            idNum = idNum.replace(/(MBC|MMC|MCC)(\d{4})[-]?(\d{4,5})/, (match, prefix, year, num) => {
              const correctedNum = num.replace(/8/g, '5')
              return `${prefix}${year}-${correctedNum}`
            })
            break
          }
        }
        if (idNum) {
          updateFormData({ idNumber: idNum })
          const exists = await checkIdNumberExists(idNum)
          if (exists) {
            setIdCheckError('This ID Number is already registered.')
            updateFormData({ idNumber: '' })
          }
        } else {
          setIdCheckError('ID number not detected. OCR output: ' + text + '\nTips: Make sure the ID is well-lit, flat, and the number is clear in the photo.')
        }
        setLoadingOcr(false)
      })
    } catch (error) {
      setIdCheckError(`Error processing image for OCR. Please try again. Details: ${error.message || error}`)
      setLoadingOcr(false)
    }
  }

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

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
          <div className="flex gap-2 items-center">
            <Input
              id="idNumber"
              placeholder="MBC2022-0426"
              value={formData.idNumber || ""}
              readOnly
              className={`rounded-lg transition-all focus:ring-2 focus:ring-green-500/20 font-manrope ${errors.idNumber ? "border-red-500 focus:ring-red-200" : ""}`}
            />
            <Button type="button" onClick={handleOpenCamera} disabled={showCamera || loadingOcr}>
              {loadingOcr ? 'Processing...' : 'Capture ID'}
            </Button>
          </div>
          {showCamera && (
            <div className="mt-2 flex flex-col items-center">
              <video ref={videoRef} width="320" height="240" autoPlay style={{ border: '1px solid #ccc', borderRadius: 8 }} />
              <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />
              <Button type="button" className="mt-2" onClick={handleCapture} disabled={loadingOcr}>
                Take Photo
              </Button>
            </div>
          )}
          {capturedImage && (
            <div className="mt-2 flex flex-col items-center">
              <img src={capturedImage} alt="Captured ID" style={{ width: 200, borderRadius: 8, border: '1px solid #ccc' }} />
              {idCheckLoading && <span className="text-xs text-gray-500 mt-1">Checking ID number...</span>}
            </div>
          )}
          {(idCheckError || errors.idNumber) && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-manrope">
              <XCircle className="h-3 w-3" /> {idCheckError || errors.idNumber}
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

