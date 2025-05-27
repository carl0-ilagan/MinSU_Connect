"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageLayout } from "@/components/layout/page-layout"
import { PostCard } from "@/components/post/post-card"
import { PostSkeleton } from "@/components/post/post-skeleton"
import { Button } from "@/components/ui/button"
import {
  Edit,
  Settings,
  Loader2,
  Camera,
  Save,
  X,
  CheckCircle,
  FileText,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  Plus,
  UserX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [friends, setFriends] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const [newHobby, setNewHobby] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const friendsPerPage = 8
  const router = useRouter()
  const { user, updateUserProfile } = useAuth()

  // Campus options
  const campusOptions = ["Main Campus", "Bongabong Campus", "Calapan Campus", "Labangan Campus", "Victoria Campus"]

  // Department options
  const departmentOptions = [
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Business Administration",
    "Bachelor of Elementary Education",
    "Bachelor of Secondary Education",
    "Bachelor of Science in Criminology",
    "Bachelor of Science in Accountancy",
    "Bachelor of Science in Tourism Management",
    "Bachelor of Science in Hospitality Management",
    "Bachelor of Science in Agriculture",
  ]

  // Common hobby suggestions
  const hobbyOptions = [
    "Reading",
    "Writing",
    "Programming",
    "Gaming",
    "Sports",
    "Music",
    "Art",
    "Cooking",
    "Photography",
    "Travel",
    "Dancing",
    "Singing",
    "Hiking",
    "Swimming",
    "Cycling",
    "Yoga",
    "Meditation",
    "Gardening",
    "Fishing",
    "Crafting",
    "3D Printing",
  ]

  // Add these pagination calculations after the state variables
  const indexOfLastFriend = currentPage * friendsPerPage
  const indexOfFirstFriend = indexOfLastFriend - friendsPerPage
  const currentFriends = friends.slice(indexOfFirstFriend, indexOfLastFriend)
  const totalPages = Math.ceil(friends.length / friendsPerPage)

  // Add these pagination handlers
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)

      if (!user) {
        // If no user is logged in, redirect to login page after a short delay
        const timeout = setTimeout(() => {
          router.push("/login")
        }, 1500)
        return () => clearTimeout(timeout)
      }

      try {
        // Fetch user profile data directly from Firestore
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          console.log("User profile data:", userData)

          // Set user profile with data from Firestore
          const profileData = {
            ...userData,
            id: user.uid,
            // Add any missing fields from Firebase Auth
            email: user.email || userData.email,
            // Initialize hobbies array if it doesn't exist
            hobbies: userData.hobbies || [],
          }

          setUserProfile(profileData)
          setEditedProfile(profileData) // Initialize edited profile with current data
        } else {
          console.log("No user profile found")
          // Handle case where user exists in Auth but not in Firestore
          setUserProfile({
            id: user.uid,
            name: user.displayName || "User",
            email: user.email,
            photoURL: user.photoURL,
            bio: "No bio available",
            hobbies: [],
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user, router])

  // Fetch user's posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return

      setLoadingPosts(true)
      try {
        // Create a query to get the user's posts - only non-anonymous posts
        const postsQuery = query(
          collection(db, "posts"),
          where("userId", "==", user.uid),
          where("status", "==", "approved"),
          where("isAnonymous", "==", false), // Only fetch non-anonymous posts
          orderBy("createdAt", "desc"),
          limit(10),
        )

        // Try the first query
        try {
          const querySnapshot = await getDocs(postsQuery)
          const fetchedPosts = []

          querySnapshot.forEach((doc) => {
            fetchedPosts.push({
              id: doc.id,
              ...doc.data(),
            })
          })

          console.log("Fetched posts:", fetchedPosts)
          setPosts(fetchedPosts)
        } catch (error) {
          console.error("Error with first query:", error)

          // Try alternative query with different field structure
          try {
            const alternativeQuery = query(
              collection(db, "posts"),
              where("user.id", "==", user.uid),
              where("status", "==", "approved"),
              where("isAnonymous", "==", false), // Only fetch non-anonymous posts
              orderBy("timestamp", "desc"),
              limit(10),
            )

            const altQuerySnapshot = await getDocs(alternativeQuery)
            const altFetchedPosts = []

            altQuerySnapshot.forEach((doc) => {
              altFetchedPosts.push({
                id: doc.id,
                ...doc.data(),
              })
            })

            console.log("Fetched posts (alternative):", altFetchedPosts)
            setPosts(altFetchedPosts)
          } catch (altError) {
            console.error("Error with alternative query:", altError)

            // Final attempt with minimal filters
            try {
              const simpleQuery = query(collection(db, "posts"), where("userId", "==", user.uid), limit(10))

              const simpleQuerySnapshot = await getDocs(simpleQuery)
              const simpleFetchedPosts = []

              simpleQuerySnapshot.forEach((doc) => {
                const postData = doc.data()
                // Only include approved and non-anonymous posts
                if (postData.status === "approved" && postData.isAnonymous === false) {
                  simpleFetchedPosts.push({
                    id: doc.id,
                    ...postData,
                  })
                }
              })

              console.log("Fetched posts (simple):", simpleFetchedPosts)
              setPosts(simpleFetchedPosts)
            } catch (simpleError) {
              console.error("Error with simple query:", simpleError)
              setPosts([])
            }
          }
        }
      } catch (error) {
        console.error("Error fetching posts:", error)
        toast({
          title: "Error",
          description: "Failed to load posts. Please try again.",
          variant: "destructive",
        })
        setPosts([])
      } finally {
        setLoadingPosts(false)
      }
    }

    fetchUserPosts()
  }, [user])

  // Fetch user's friends
  useEffect(() => {
    const fetchUserFriends = async () => {
      if (!user) {
        console.log("No user found, cannot fetch friends")
        return
      }

      setLoadingFriends(true)
      try {
        console.log("Starting to fetch friends for user:", user.uid)
        
        // Get user's friends from friendships collection
        const friendshipsRef = collection(db, "friendships")
        console.log("Created friendships reference")

        // Try both query approaches
        let querySnapshot
        try {
          // First try: query by users array
          console.log("Attempting to query with array-contains")
        const friendshipsQuery = query(
          friendshipsRef,
          where("users", "array-contains", user.uid)
        )
          querySnapshot = await getDocs(friendshipsQuery)
          console.log("Got query snapshot (array-contains), size:", querySnapshot.size)
          
          if (querySnapshot.empty) {
            console.log("No results with array-contains, trying userId query")
            // Second try: query by userId field
            const userIdQuery = query(
              friendshipsRef,
              where("userId", "==", user.uid)
            )
            querySnapshot = await getDocs(userIdQuery)
            console.log("Got query snapshot (userId), size:", querySnapshot.size)
          }
        } catch (error) {
          console.error("Error with first query attempt:", error)
          try {
            console.log("Attempting alternative query with userId")
            const userIdQuery = query(
              friendshipsRef,
              where("userId", "==", user.uid)
            )
            querySnapshot = await getDocs(userIdQuery)
            console.log("Got query snapshot (userId), size:", querySnapshot.size)
          } catch (altError) {
            console.error("Error with alternative query:", altError)
            throw altError
          }
        }

        const friendIds = new Set() // Use Set to avoid duplicates

        querySnapshot.forEach((doc) => {
          const friendship = doc.data()
          console.log("Processing friendship document:", doc.id, friendship)
          
          if (friendship.users && Array.isArray(friendship.users)) {
            console.log("Found users array:", friendship.users)
            // Get all users except the current user
            friendship.users.forEach(id => {
              if (id !== user.uid) {
                friendIds.add(id)
                console.log("Added friend ID:", id)
              }
            })
          } else if (friendship.userId && friendship.userId !== user.uid) {
            console.log("Found userId:", friendship.userId)
            friendIds.add(friendship.userId)
          }
        })

        console.log("Collected unique friend IDs:", Array.from(friendIds))

        if (friendIds.size === 0) {
          console.log("No friends found, setting empty array")
          setFriends([])
          setLoadingFriends(false)
          return
        }

        // Fetch friend profiles with better error handling
        const friendProfiles = []
        const friendPromises = Array.from(friendIds).map(async (friendId) => {
          try {
            console.log("Fetching profile for friend:", friendId)
          const friendDocRef = doc(db, "users", friendId)
          const friendDoc = await getDoc(friendDocRef)

          if (friendDoc.exists()) {
            const friendData = friendDoc.data()
            console.log("Found friend data:", friendData)
              return {
              id: friendId,
              ...friendData,
              }
            } else {
              console.log("No profile found for friend:", friendId)
              return null
          }
          } catch (error) {
            console.error(`Error fetching friend ${friendId}:`, error)
            return null
          }
        })

        // Wait for all friend profile fetches to complete with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Friend profile fetch timeout')), 10000)
        )
        
        const results = await Promise.race([
          Promise.all(friendPromises),
          timeoutPromise
        ])

        const validProfiles = results.filter(Boolean)
        console.log("All friend profiles fetched:", validProfiles)

        // Sort friends by name
        validProfiles.sort((a, b) => {
          const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase()
          const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase()
          return nameA.localeCompare(nameB)
        })

        console.log("Setting final friend profiles:", validProfiles)
        setFriends(validProfiles)
      } catch (error) {
        console.error("Error in fetchFriends:", error)
        // More specific error message based on the error type
        let errorMessage = "Failed to load friends. Please try again."
        if (error.message === 'Friend profile fetch timeout') {
          errorMessage = "Loading friends took too long. Please try again."
        } else if (error.code === 'permission-denied') {
          errorMessage = "You don't have permission to view friends."
          console.error("Permission denied error details:", error)
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        setFriends([])
      } finally {
        setLoadingFriends(false)
      }
    }

    if (user) {
      console.log("Starting friends fetch for userId:", user.uid)
    fetchUserFriends()
    }
  }, [user, toast])

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditedProfile(userProfile)
    }
    setIsEditing(!isEditing)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (max 2MB for base64 storage in Firestore)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image size should be less than 2MB")
      return
    }

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
        setEditedProfile((prev) => ({
          ...prev,
          photoURL: base64String,
        }))
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

  const handleAddHobby = () => {
    if (!newHobby.trim()) return

    // Check if hobby already exists
    if (editedProfile.hobbies && editedProfile.hobbies.includes(newHobby.trim())) {
      toast({
        title: "Hobby already exists",
        description: "This hobby is already in your list.",
        variant: "destructive",
      })
      return
    }

    // Add the new hobby
    setEditedProfile((prev) => ({
      ...prev,
      hobbies: [...(prev.hobbies || []), newHobby.trim()],
    }))

    // Clear the input
    setNewHobby("")
  }

  const handleRemoveHobby = (hobbyToRemove) => {
    setEditedProfile((prev) => ({
      ...prev,
      hobbies: prev.hobbies.filter((hobby) => hobby !== hobbyToRemove),
    }))
  }

  const handleSelectHobby = (hobby) => {
    // Check if hobby already exists
    if (editedProfile.hobbies && editedProfile.hobbies.includes(hobby)) {
      toast({
        title: "Hobby already exists",
        description: "This hobby is already in your list.",
        variant: "destructive",
      })
      return
    }

    // Add the selected hobby
    setEditedProfile((prev) => ({
      ...prev,
      hobbies: [...(prev.hobbies || []), hobby],
    }))
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await updateUserProfile(user.uid, editedProfile)
      setUserProfile(editedProfile)
      setIsEditing(false)

      // Show success notification
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (profile) => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    }
    return "U"
  }

  const getFullName = (profile) => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`
    }
    return profile?.name || "User"
  }

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const handleUnfriend = async (friendId) => {
    if (!user) return

    try {
      // Find the friendship document
      const friendshipsRef = collection(db, "friendships")
      const friendshipsQuery = query(
        friendshipsRef,
        where("users", "array-contains", user.uid),
        where("status", "==", "accepted")
      )
      const friendshipsSnapshot = await getDocs(friendshipsQuery)
      
      let friendshipDoc = null
      friendshipsSnapshot.forEach((doc) => {
        const friendship = doc.data()
        if (friendship.users.includes(friendId)) {
          friendshipDoc = doc
        }
      })

      if (friendshipDoc) {
        // Delete the friendship document
        await deleteDoc(friendshipDoc.ref)
        
        // Remove from friends list
        setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId))
        
        toast({
          title: "Unfriended",
          description: "Friend removed successfully.",
        })
      }
    } catch (error) {
      console.error("Error unfriending:", error)
      toast({
        title: "Error",
        description: "Failed to unfriend. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getReactionSummary = () => {
    if (!safePost.reactions || Object.keys(safePost.reactions).length === 0 || isLoadingReactors) return null

    const reactions = Object.entries(safePost.reactions)
    const latestReactor = reactorsData[reactions[0][0]]

    if (!latestReactor) return null

    const latestReactorName = latestReactor.firstName && latestReactor.lastName
      ? `${latestReactor.firstName} ${latestReactor.lastName}`
      : latestReactor.displayName || "Unknown User"

    const remainingCount = reactions.length - 1

    if (remainingCount === 0) {
      return latestReactorName
    } else if (remainingCount === 1) {
      return `${latestReactorName} and 1 other` // Already shows "other"
    } else {
      return `${latestReactorName} and ${remainingCount} others` // Already shows "others"
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="h-64 bg-gradient-to-r from-green-400/20 to-emerald-500/20 animate-pulse rounded-lg mb-6"></div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="h-32 w-32 rounded-full bg-muted animate-pulse -mt-16 border-4 border-background"></div>
            <div className="pt-4 space-y-2">
              <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </PageLayout>
    )
  }

  if (!userProfile) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-medium">Loading profile...</h3>
          <p className="text-muted-foreground">Please wait while we fetch your profile data.</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-16 inset-x-0 z-50 flex justify-center animate-in fade-in slide-in-from-top-5 duration-300">
          <Alert className="bg-green-50 border-green-200 text-green-800 shadow-lg max-w-md">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <AlertDescription className="font-medium">Profile updated successfully!</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="relative">
        {/* Enhanced Banner with Profile Info */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 md:p-10 rounded-xl mb-6 relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute top-10 -left-10 w-40 h-40 bg-white/5 rounded-full"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Image */}
              <div className="relative">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white/90 shadow-lg">
                  {isEditing ? (
                    <>
                      <AvatarImage
                        src={editedProfile.photoURL || "/placeholder.svg"}
                        alt={getFullName(editedProfile)}
                      />
                      <label
                        htmlFor="profile-image-upload"
                        className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Camera className="h-8 w-8 text-white" />
                        <input
                          id="profile-image-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <AvatarImage src={userProfile.photoURL || "/placeholder.svg"} alt={getFullName(userProfile)} />
                      <AvatarFallback className="text-2xl bg-white/20 text-white">
                        {getInitials(userProfile)}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                {uploadError && <p className="text-xs text-red-200 mt-1 max-w-[150px]">{uploadError}</p>}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div>
                        <Label htmlFor="firstName" className="text-white/90 text-sm">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={editedProfile.firstName || ""}
                          onChange={handleInputChange}
                          className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-white/90 text-sm">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={editedProfile.lastName || ""}
                          onChange={handleInputChange}
                          className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="idNumber" className="text-white/90 text-sm">
                        ID Number
                      </Label>
                      <Input
                        id="idNumber"
                        name="idNumber"
                        value={editedProfile.idNumber || ""}
                        onChange={handleInputChange}
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                        placeholder="Enter your ID number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio" className="text-white/90 text-sm">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={editedProfile.bio || ""}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself"
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/50 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl md:text-3xl font-bold">{getFullName(userProfile)}</h1>
                    <p className="text-white/80 mt-1">{userProfile.idNumber || "No ID Number"}</p>
                    <p className="text-white/90 mt-2 max-w-2xl">{userProfile.bio || "No bio available"}</p>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSaveProfile}
                        className="bg-white text-primary hover:bg-white/90"
                        disabled={isUploading || isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleEditToggle}
                        variant="outline"
                        className="bg-transparent border-white text-white hover:bg-white/20"
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleEditToggle} className="bg-white text-primary hover:bg-white/90">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button className="bg-white/80 text-primary hover:bg-white/90" asChild>
                        <Link href="/user/settings">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Profile Information */}
            {!isEditing && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-white/90">
                <div className="space-y-2">
                  {userProfile.department && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-white/70" />
                      <span className="font-medium">Course:</span> {userProfile.department}
                    </div>
                  )}

                  {userProfile.campus && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-white/70" />
                      <span className="font-medium">Campus:</span> {userProfile.campus}
                    </div>
                  )}

                  {userProfile.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-white/70" />
                      <span className="font-medium">Joined:</span> {formatDate(userProfile.createdAt)}
                    </div>
                  )}
                </div>

                {/* Hobbies */}
                {userProfile.hobbies && userProfile.hobbies.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Hobbies</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {userProfile.hobbies.map((hobby, index) => (
                        <Badge key={index} className="bg-white/20 hover:bg-white/30 text-white border-none">
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            {!isEditing && (
              <div className="flex gap-6 mt-4 text-sm border-t border-white/20 pt-4">
                <div>
                  <span className="font-bold">{posts.length}</span> Posts
                </div>
                <div>
                  <span className="font-bold">{friends.length}</span> Friends
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Academic Info & Hobbies Section - Only in Edit Mode */}
        {isEditing && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="department">Department/Course</Label>
                  <Select
                    value={editedProfile.department || ""}
                    onValueChange={(value) => handleSelectChange("department", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="campus">Campus</Label>
                  <Select
                    value={editedProfile.campus || ""}
                    onValueChange={(value) => handleSelectChange("campus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {campusOptions.map((campus) => (
                        <SelectItem key={campus} value={campus}>
                          {campus}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Hobbies Editor */}
              <div className="mt-6">
                <Label className="text-lg font-medium">Hobbies</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Add your hobbies and interests to help others connect with you.
                </p>

                {/* Current Hobbies */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {editedProfile.hobbies && editedProfile.hobbies.length > 0 ? (
                    editedProfile.hobbies.map((hobby, index) => (
                      <Badge
                        key={index}
                        className="bg-primary/10 text-primary hover:bg-primary/20 py-1.5 pl-3 pr-2 flex items-center gap-1"
                      >
                        {hobby}
                        <button
                          type="button"
                          onClick={() => handleRemoveHobby(hobby)}
                          className="text-primary/70 hover:text-primary rounded-full p-0.5"
                          aria-label={`Remove ${hobby}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No hobbies added yet.</p>
                  )}
                </div>

                {/* Add New Hobby */}
                <div className="flex gap-2 mb-4">
                  <Input
                    type="text"
                    placeholder="Add a hobby..."
                    value={newHobby}
                    onChange={(e) => setNewHobby(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddHobby()
                      }
                    }}
                  />
                  <Button onClick={handleAddHobby} type="button" className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Hobby Suggestions */}
                <div>
                  <Label className="text-sm">Suggestions:</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {hobbyOptions
                      .filter((hobby) => !editedProfile.hobbies?.includes(hobby))
                      .slice(0, 10)
                      .map((hobby) => (
                        <Badge
                          key={hobby}
                          className="bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer"
                          onClick={() => handleSelectHobby(hobby)}
                        >
                          {hobby}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Section */}
        <Tabs defaultValue="posts" className="mt-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger
              value="posts"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              Posts
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary hover:bg-primary/20">
                {posts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4" />
              Friends
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary hover:bg-primary/20">
                {friends.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6 animate-in slide-in-from-bottom-2 duration-300">
            {loadingPosts ? (
              <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-lg font-medium">No posts yet</h3>
                <p className="text-muted-foreground mb-4">You haven't created any posts yet.</p>
                <Button className="mt-2" asChild>
                  <Link href="/user/create">Create Post</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="friends" className="mt-6 animate-in slide-in-from-bottom-2 duration-300">
            {loadingFriends ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-muted rounded-lg mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : friends.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="bg-muted/20 hover:bg-muted/40 transition-colors rounded-lg p-4 text-center group relative"
                    >
                      <Link
                        href={`/user/profile/${friend.id}`}
                        className="block"
                      >
                        <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-primary/10 group-hover:border-primary/30 transition-colors">
                          <AvatarImage
                            src={friend.photoURL || "/placeholder.svg"}
                            alt={`${friend.firstName} ${friend.lastName}`}
                          />
                          <AvatarFallback>
                            {friend.firstName?.[0]}
                            {friend.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium group-hover:text-primary transition-colors truncate">
                          {friend.firstName} {friend.lastName}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {friend.department || friend.campus || "Student"}
                        </p>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleUnfriend(friend.id)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium">No friends yet</h3>
                <p className="text-muted-foreground mb-4">Connect with other users to add them as friends.</p>
                <Button className="mt-2" asChild>
                  <Link href="/user/search">Find Friends</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
