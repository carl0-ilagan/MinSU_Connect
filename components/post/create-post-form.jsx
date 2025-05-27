"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { X, Loader2, CheckCircle2, XCircle, Send, ImagePlus, VideoIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

// Anonymous user profile image
const ANONYMOUS_PROFILE_IMAGE = "/anonymous-user.jpeg"

// Maximum size for Firestore document (1MB to be safe)
const MAX_FIRESTORE_SIZE = 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

export function CreatePostForm({ onPostCreated }) {
  const [content, setContent] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null)
  const [processingStatus, setProcessingStatus] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const { toast } = useToast()
  const { user, userData } = useAuth()
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const textareaRef = useRef(null)

  // Focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  // Handle text input with auto-resize
  const handleTextChange = (e) => {
    setContent(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > MAX_FIRESTORE_SIZE) {
        toast({
          title: "File too large",
          description: "Image must be less than 1MB",
          variant: "destructive",
        })
        return
      }

      setSelectedImage(file)
      setSelectedVideo(null)
      setVideoPreviewUrl(null)
      setIsProcessing(true)
      setProcessingStatus("Processing image...")
      setProcessingProgress(10)

      // Create preview immediately
      const reader = new FileReader()
      reader.onload = () => {
        const imageData = reader.result
        setPreviewUrl(imageData)
        setProcessingProgress(30)

        // Check if image needs compression
        if (imageData.length > MAX_FIRESTORE_SIZE) {
          setProcessingStatus("Compressing image...")
          compressImageToSize(imageData, MAX_FIRESTORE_SIZE).then((compressed) => {
            console.log(
              `Compressed image: ${Math.round(imageData.length / 1024)}KB → ${Math.round(compressed.length / 1024)}KB`,
            )
            setProcessingProgress(100)
            setProcessingStatus("Image ready")
            setIsProcessing(false)
            setPreviewUrl(compressed)
          })
        } else {
          setProcessingProgress(100)
          setProcessingStatus("Image ready")
          setIsProcessing(false)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > MAX_VIDEO_SIZE) {
        toast({
          title: "File too large",
          description: "Video must be less than 50MB",
          variant: "destructive",
        })
        return
      }

      setSelectedVideo(file)
      setSelectedImage(null)
      setPreviewUrl(null)
      setIsProcessing(true)
      setProcessingStatus("Processing video...")
      setProcessingProgress(10)

      const reader = new FileReader()
      reader.onload = () => {
        const videoData = reader.result
        setVideoPreviewUrl(videoData)
        setProcessingProgress(100)
        setProcessingStatus("Video ready")
        setIsProcessing(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeMedia = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
    setSelectedVideo(null)
    setVideoPreviewUrl(null)
    setProcessingProgress(0)
    setProcessingStatus("")
    setIsProcessing(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (videoInputRef.current) videoInputRef.current.value = ""
  }

  // Cancel processing
  const cancelProcessing = () => {
    removeMedia()
    setProcessingStatus("Processing cancelled")

    toast({
      title: "Processing Cancelled",
      description: "Media processing has been cancelled.",
      variant: "default",
    })

    // Wait a moment then clear the status
    setTimeout(() => {
      setProcessingStatus("")
    }, 1500)
  }

  // Compress image to a specific target size
  const compressImageToSize = async (base64Str, targetSize, maxAttempts = 10) => {
    let quality = 0.7
    let compressed = base64Str
    let attempt = 0

    // Start with the original image
    const img = new Image()
    img.src = base64Str

    // Wait for image to load
    await new Promise((resolve) => {
      img.onload = resolve
    })

    // Calculate initial dimensions (max 1200px width/height)
    let width = img.width
    let height = img.height
    let maxDimension = 1200

    if (width > height && width > maxDimension) {
      height = (height * maxDimension) / width
      width = maxDimension
    } else if (height > maxDimension) {
      width = (width * maxDimension) / height
      height = maxDimension
    }

    // Try compression with progressively lower quality and dimensions
    while (compressed.length > targetSize && attempt < maxAttempts) {
      attempt++
      setProcessingProgress(30 + attempt * 7)

      // Adjust quality and dimensions based on attempt number
      if (attempt > 1) {
        quality = Math.max(0.1, quality - 0.1)
        maxDimension = Math.max(400, maxDimension - 200)

        // Recalculate dimensions
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width
          width = maxDimension
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height
          height = maxDimension
        }
      }

      setProcessingStatus(`Compressing image (attempt ${attempt})...`)

      // Create canvas and compress
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0, width, height)

      // Get compressed data
      compressed = canvas.toDataURL("image/jpeg", quality)

      console.log(`Compression attempt ${attempt}: Quality ${quality}, Size ${Math.round(compressed.length / 1024)}KB`)
    }

    if (compressed.length > targetSize) {
      // If still too large, show warning
      toast({
        title: "Image still too large",
        description: "Using best compression. Post may fail if image is too large.",
        variant: "warning",
      })
    }

    return compressed
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim() && !previewUrl && !videoPreviewUrl) {
      toast({
        title: "Error",
        description: "Please add some content, an image, or a video to your post.",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a post.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setProcessingStatus("Preparing post...")
    setProcessingProgress(10)

    try {
      // Get user profile information
      const userFullName =
        userData?.firstName && userData?.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : user.displayName || user.email.split("@")[0]

      const userProfileImage = userData?.profileImage || userData?.photoURL || user.photoURL || null

      // Prepare post data
      const postData = {
        content: content.trim() || "",
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        status: "pending",
        userId: user.uid,
        isAnonymous: isAnonymous,
        firstName: isAnonymous ? null : userData?.firstName || null,
        lastName: isAnonymous ? null : userData?.lastName || null,
        userName: isAnonymous ? "Anonymous" : userFullName,
        userAvatar: isAnonymous ? ANONYMOUS_PROFILE_IMAGE : userProfileImage,
        userProfileImage: isAnonymous ? null : userProfileImage,
        profileImage: isAnonymous ? null : userProfileImage,
      }

      // Add image if available
      if (previewUrl) {
        setProcessingStatus("Adding image to post...")
        setProcessingProgress(40)
        postData.image = previewUrl
        setProcessingProgress(70)
      }

      // Add video if available
      if (videoPreviewUrl) {
        setProcessingStatus("Adding video to post...")
        setProcessingProgress(40)
        postData.video = videoPreviewUrl
        setProcessingProgress(70)
      }

      setProcessingStatus("Saving post...")
      setProcessingProgress(80)

      // Save to Firestore
      const docRef = await addDoc(collection(db, "posts"), postData)
      console.log("Post saved successfully with ID:", docRef.id)

      setProcessingStatus("Post submitted successfully!")
      setProcessingProgress(100)

      // Reset form
      setContent("")
      setSelectedImage(null)
      setPreviewUrl(null)
      setSelectedVideo(null)
      setVideoPreviewUrl(null)
      setProcessingProgress(0)
      setProcessingStatus("")
      if (fileInputRef.current) fileInputRef.current.value = ""
      if (videoInputRef.current) videoInputRef.current.value = ""
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }

      // Call the onPostCreated callback if provided
      if (typeof onPostCreated === "function") {
        onPostCreated()
      }

      toast({
        title: "Success",
        description: "Your post has been submitted for approval.",
        icon: <CheckCircle2 className="h-4 w-4" />,
        variant: "success",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      let userErrorMessage = "Failed to create post. Please try again."

      if (error.code === "permission-denied") {
        userErrorMessage = "You don't have permission to create this post. Please check if you're logged in and try again."
      } else if (error.code === "unavailable") {
        userErrorMessage = "Network error. Please check your connection and try again."
      } else if (error.message && error.message.includes("maximum allowed size")) {
        userErrorMessage = "Your post is too large. Please use a smaller image or video."
      }

      toast({
        title: "Error",
        description: userErrorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setProcessingStatus("")
      setProcessingProgress(0)
    }
  }

  // Get the user's profile image from various possible sources
  const getUserProfileImage = () => {
    if (isAnonymous) {
      return ANONYMOUS_PROFILE_IMAGE
    }

    // Try all possible sources in order of preference
    return userData?.profileImage || userData?.photoURL || user?.photoURL || "/abstract-geometric-shapes.png"
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (isAnonymous) return "A"

    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
    }

    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }

    return user?.email?.[0].toUpperCase() || "U"
  }

  return (
    <Card className="mb-6 animate-in shadow-lg border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Create Post
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              {isAnonymous ? (
                <AvatarImage src={ANONYMOUS_PROFILE_IMAGE || "/placeholder.svg"} alt="Anonymous" />
              ) : (
                <>
                  <AvatarImage
                    src={getUserProfileImage() || "/placeholder.svg"}
                    alt={userData?.firstName || "Your avatar"}
                    onError={(e) => {
                      console.error("Error loading avatar:", e)
                      e.target.src = "/placeholder.svg"
                    }}
                  />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </>
              )}
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={isAnonymous ? "Post anonymously..." : "What's on your mind?"}
                value={content}
                onChange={handleTextChange}
                className="min-h-[100px] resize-none border-0 bg-muted/30 focus-visible:ring-1 text-base p-3 rounded-xl"
                ref={textareaRef}
              />
            </div>
          </div>

          {previewUrl && (
            <div className="relative mt-2 rounded-xl overflow-hidden border bg-black/5 transition-all duration-200 hover:bg-black/10">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                className="max-h-[300px] w-full object-contain"
                onError={(e) => {
                  console.error("Error loading preview image:", e)
                  e.target.src = "/placeholder.svg"
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {videoPreviewUrl && (
            <div className="relative mt-2 rounded-xl overflow-hidden border bg-black/5">
              <video
                src={videoPreviewUrl}
                controls
                className="max-h-[300px] w-full object-contain"
                onError={(e) => {
                  console.error("Error loading video:", e)
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {processingStatus && <div className="text-sm text-muted-foreground animate-pulse">{processingStatus}</div>}

          {isProcessing && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{processingProgress}% complete</span>
                <Button type="button" variant="outline" size="sm" onClick={cancelProcessing} className="h-8 text-xs">
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous-mode"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                className={isAnonymous ? "bg-primary" : ""}
              />
              <Label htmlFor="anonymous-mode" className="cursor-pointer">
                Post anonymously
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-3 border-dashed hover:bg-primary/5 hover:border-primary/50 transition-colors"
                asChild
              >
                <label className="cursor-pointer">
                  <ImagePlus className="h-4 w-4 mr-1.5" />
                  Image
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    disabled={isSubmitting || isProcessing}
                  />
                </label>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-3 border-dashed hover:bg-primary/5 hover:border-primary/50 transition-colors"
                asChild
              >
                <label className="cursor-pointer">
                  <VideoIcon className="h-4 w-4 mr-1.5" />
                  Video
                  <input
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    onChange={handleVideoChange}
                    ref={videoInputRef}
                    disabled={isSubmitting || isProcessing}
                  />
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button
            type="submit"
            className="ml-auto rounded-full px-5 transition-all duration-200 hover:shadow-md"
            disabled={isSubmitting || isProcessing}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {processingStatus ? "Processing..." : "Submitting..."}
              </>
            ) : (
              "Submit for Approval"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
