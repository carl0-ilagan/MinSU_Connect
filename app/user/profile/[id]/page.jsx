"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { PageLayout } from "@/components/layout/page-layout"
import { PostCard } from "@/components/post/post-card"
import { PostSkeleton } from "@/components/post/post-skeleton"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  UserPlus,
  UserCheck,
  Clock,
  MessageSquare,
  UserX,
  FileText,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  deleteDoc,
  addDoc,
  onSnapshot,
  writeBatch,
} from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Add this function at the top level, before the component
const createFriendAcceptedNotification = async (senderId, receiverId, receiverName, receiverPhoto) => {
  try {
    const notificationsRef = collection(db, "notifications")
    await addDoc(notificationsRef, {
      type: "friend_accepted",
      userId: senderId,
      receiverId: receiverId,
      message: `${receiverName} accepted your friend request`,
      photoURL: receiverPhoto,
      read: false,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error creating friend accepted notification:", error)
  }
}

export default function UserProfilePage() {
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [friends, setFriends] = useState([])
  const [friendsLoading, setFriendsLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState("none")
  const [error, setError] = useState(null)
  const router = useRouter()
  const params = useParams()
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const userId = params.id
  const [showUnfriend, setShowUnfriend] = useState(false)
  const unfriendTimeoutRef = useRef(null)
  const [showUnfriendDialog, setShowUnfriendDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const friendsPerPage = 8
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [showFriendUnfriendDialog, setShowFriendUnfriendDialog] = useState(false)
  const [friendToUnfriend, setFriendToUnfriend] = useState(null)

  // Calculate pagination
  const indexOfLastFriend = currentPage * friendsPerPage
  const indexOfFirstFriend = indexOfLastFriend - friendsPerPage
  const currentFriends = friends.slice(indexOfFirstFriend, indexOfLastFriend)
  const totalPages = Math.ceil(friends.length / friendsPerPage)

  // Pagination handlers
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      setError(null)

      if (!user) {
        // If no user is logged in, redirect to login page after a short delay
        const timeout = setTimeout(() => {
          router.push("/login")
        }, 1500)
        return () => clearTimeout(timeout)
      }

      try {
        // Check if user is viewing their own profile
        if (userId === user.uid) {
          router.push("/user/profile")
          return
        }

        // Fetch user profile data
        const userDocRef = doc(db, "users", userId)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          console.log("User profile data:", userData)

          // Set user profile
          const profileData = {
            ...userData,
            id: userId,
          }

          setUserProfile(profileData)

          // Set up real-time listener for friendship status
          const friendshipRef = collection(db, "friendships")
          const friendshipQuery = query(
            friendshipRef,
            where("users", "array-contains", user.uid)
          )

          const unsubscribeFriendship = onSnapshot(friendshipQuery, (snapshot) => {
            let isFriend = false
            snapshot.forEach((doc) => {
              const friendship = doc.data()
              if (friendship.users.includes(userId)) {
                isFriend = true
              }
            })

            if (isFriend) {
              setFriendStatus("accepted")
            } else {
              // Check friend requests
              const checkFriendRequests = async () => {
                // Check received requests
                const receivedRequestRef = doc(db, "friendRequests", `${userId}_${user.uid}`)
                const receivedRequestDoc = await getDoc(receivedRequestRef)

                if (receivedRequestDoc.exists() && receivedRequestDoc.data().status === "pending") {
                  setFriendStatus("received")
                  return
                }

                // Check sent requests
                const sentRequestRef = doc(db, "friendRequests", `${user.uid}_${userId}`)
                const sentRequestDoc = await getDoc(sentRequestRef)

                if (sentRequestDoc.exists()) {
                  const requestData = sentRequestDoc.data()
                  if (requestData.status === "pending") {
                    setFriendStatus("pending")
                  } else if (requestData.status === "declined") {
                    setFriendStatus("declined")
                  } else {
                    setFriendStatus("none")
                  }
                } else {
                  setFriendStatus("none")
                }
              }

              checkFriendRequests()
            }
          })

          // Set up real-time listener for friend requests
          const friendRequestsRef = collection(db, "friendRequests")
          const friendRequestsQuery = query(
            friendRequestsRef,
            where("receiverId", "==", user.uid),
            where("status", "==", "pending")
          )

          const unsubscribeRequests = onSnapshot(friendRequestsQuery, async (snapshot) => {
            let hasReceivedRequest = false
            snapshot.forEach((doc) => {
              const request = doc.data()
              if (request.senderId === userId) {
                hasReceivedRequest = true
              }
            })

            if (hasReceivedRequest) {
              setFriendStatus("received")
            }
          })

          return () => {
            unsubscribeFriendship()
            unsubscribeRequests()
          }
        } else {
          console.log("No user profile found")
          setError("User not found")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError("Error loading profile. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUserData()
    }
  }, [userId, user, router])

  // Fetch posts separately to handle permissions errors gracefully
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!userId || !user) return

      setPostsLoading(true)
      try {
        console.log("Fetching posts for user:", userId)

        // Try different query combinations to find posts
        // First, try with minimal filters to see if we can access any posts
        const postsRef = collection(db, "posts")

        // Query 1: Filter by userId, status, and isAnonymous=false
        let postsQuery = query(
          postsRef,
          where("userId", "==", userId),
          where("status", "in", ["approved", "reviewed"]),
          where("isAnonymous", "==", false), // Only fetch non-anonymous posts
          limit(10),
        )

        let postsSnapshot = await getDocs(postsQuery)
        const postsData = []

        if (postsSnapshot.empty) {
          console.log("No posts found with basic query, trying alternative fields")

          // Query 2: Try with user.id instead of userId
          postsQuery = query(
            postsRef,
            where("user.id", "==", userId),
            where("status", "in", ["approved", "reviewed"]),
            where("isAnonymous", "==", false), // Only fetch non-anonymous posts
            limit(10),
          )

          postsSnapshot = await getDocs(postsQuery)
        }

        // Process results
        postsSnapshot.forEach((doc) => {
          const data = doc.data()
          // Use timestamp field if it exists, otherwise use createdAt
          const timestamp = data.timestamp || data.createdAt || new Date()

          // Only include non-anonymous posts
          if (data.isAnonymous !== true) {
            postsData.push({
              id: doc.id,
              ...data,
              // Convert timestamp to ISO string if it's a Firebase timestamp
              timestamp:
                timestamp instanceof Date
                  ? timestamp.toISOString()
                  : timestamp?.toDate
                    ? timestamp.toDate().toISOString()
                    : new Date().toISOString(),
            })
          }
        })

        // Sort by timestamp (newest first) since we might not be able to use orderBy in the query
        postsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

        console.log(`Found ${postsData.length} posts for user ${userId}`)
        setPosts(postsData)
      } catch (error) {
        console.error("Error fetching posts:", error)
        // Don't set error state, just show empty posts
        setPosts([])
      } finally {
        setPostsLoading(false)
      }
    }

    fetchUserPosts()
  }, [userId, user])

  // Update the friends fetching useEffect
  useEffect(() => {
    const fetchFriends = async () => {
      if (!userId) {
        console.log("No userId provided")
        return
      }

      setFriendsLoading(true)
      try {
        console.log("Starting to fetch friends for user:", userId)
        
        // Get user's friends from friendships collection
        const friendshipsRef = collection(db, "friendships")
        console.log("Created friendships reference")

        // Try both query approaches
        let querySnapshot
        try {
          // First try: query by users array
          const friendshipsQuery = query(
            friendshipsRef,
            where("users", "array-contains", userId)
          )
          querySnapshot = await getDocs(friendshipsQuery)
          console.log("Got query snapshot (array-contains), size:", querySnapshot.size)
        } catch (error) {
          console.log("Array-contains query failed, trying alternative query:", error)
          // Second try: query by userId field
          const friendshipsQuery = query(
            friendshipsRef,
            where("userId", "==", userId)
          )
          querySnapshot = await getDocs(friendshipsQuery)
          console.log("Got query snapshot (userId), size:", querySnapshot.size)
        }

        const friendIds = new Set() // Use Set to avoid duplicates

        querySnapshot.forEach((doc) => {
          const friendship = doc.data()
          console.log("Processing friendship document:", doc.id, friendship)
          
          if (friendship.users && Array.isArray(friendship.users)) {
            // Get all users except the current user
            friendship.users.forEach(id => {
              if (id !== userId) {
                friendIds.add(id)
              }
            })
          } else if (friendship.userId && friendship.userId !== userId) {
            // Handle single-user friendship structure
            friendIds.add(friendship.userId)
          }
        })

        console.log("Collected unique friend IDs:", Array.from(friendIds))

        if (friendIds.size === 0) {
          console.log("No friends found, setting empty array")
          setFriends([])
          setFriendsLoading(false)
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
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        setFriends([])
      } finally {
        setFriendsLoading(false)
      }
    }

    if (userId) {
      console.log("Starting friends fetch for userId:", userId)
      fetchFriends()
    }
  }, [userId, toast])

  // Handle friend request
  const handleFriendRequest = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to send friend requests",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a friend request
      const friendRequestRef = doc(db, "friendRequests", `${user.uid}_${userId}`)
      await setDoc(friendRequestRef, {
        senderId: user.uid,
        senderName:
          userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : user.displayName || "User",
        senderPhoto: userData?.profileImage || user.photoURL,
        receiverId: userId,
        receiverName:
          userProfile.firstName && userProfile.lastName
            ? `${userProfile.firstName} ${userProfile.lastName}`
            : userProfile.name || "User",
        receiverPhoto: userProfile.photoURL,
        status: "pending",
        createdAt: serverTimestamp(),
      })

      setFriendStatus("pending")
      toast({
        title: "Friend request sent",
        description: `Your friend request has been sent to ${userProfile.firstName || "User"}.`,
      })
    } catch (error) {
      console.error("Error sending friend request:", error)
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle unfriend
  const handleUnfriend = async () => {
    if (!user || !commentToDelete) {
      toast({
        title: "Authentication required",
        description: "Please log in to unfriend this user",
        variant: "destructive",
      })
      return
    }

    try {
      // Find the friendship document
      const friendshipsRef = collection(db, "friendships")
      const q = query(
        friendshipsRef,
        where("users", "array-contains", user.uid)
      )

      const querySnapshot = await getDocs(q)
      let friendshipDoc = null

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.users && data.users.includes(commentToDelete.id)) {
          friendshipDoc = doc
        }
      })

      if (!friendshipDoc) {
        throw new Error("Friendship not found")
      }

      // Delete the friendship document
      await deleteDoc(doc(db, "friendships", friendshipDoc.id))

      // Update UI immediately
      setFriendStatus("none")
      setShowUnfriendDialog(false)
      setCommentToDelete(null)
      setFriends(prevFriends => prevFriends.filter(friend => friend.id !== commentToDelete.id))

      // If we're on the friends tab and the current page becomes empty, go to previous page
      if (currentFriends.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      }

      toast({
        title: "Unfriended",
        description: `You are no longer friends with ${commentToDelete.firstName} ${commentToDelete.lastName}`,
      })
    } catch (error) {
      console.error("Error in unfriend process:", error)
      toast({
        title: "Error",
        description: "Failed to unfriend. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add a function to handle unfriend from friend card
  const handleFriendCardUnfriend = (friend) => {
    setFriendToUnfriend(friend)
    setShowFriendUnfriendDialog(true)
  }

  // Add function to confirm unfriend from friend card
  const confirmFriendCardUnfriend = async () => {
    if (!user || !friendToUnfriend) return

    try {
      // Find the friendship document
      const friendshipsRef = collection(db, "friendships")
      const q = query(
        friendshipsRef,
        where("users", "array-contains", user.uid)
      )

      const querySnapshot = await getDocs(q)
      let friendshipDoc = null

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.users && data.users.includes(friendToUnfriend.id)) {
          friendshipDoc = doc
        }
      })

      if (!friendshipDoc) {
        throw new Error("Friendship not found")
      }

      // Delete the friendship document
      await deleteDoc(doc(db, "friendships", friendshipDoc.id))

      // Update UI immediately
      setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendToUnfriend.id))
      setShowFriendUnfriendDialog(false)
      setFriendToUnfriend(null)

      // If we're on the friends tab and the current page becomes empty, go to previous page
      if (currentFriends.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      }

      toast({
        title: "Unfriended",
        description: `You are no longer friends with ${friendToUnfriend.firstName} ${friendToUnfriend.lastName}`,
      })
    } catch (error) {
      console.error("Error in unfriend process:", error)
      toast({
        title: "Error",
        description: "Failed to unfriend. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update the handleAcceptRequest function
  const handleAcceptRequest = async () => {
    if (!user) return

    try {
      // Get the friend request
      const friendRequestRef = doc(db, "friendRequests", `${userId}_${user.uid}`)
      const friendRequestDoc = await getDoc(friendRequestRef)

      if (!friendRequestDoc.exists()) {
        toast({
          title: "Error",
          description: "Friend request not found.",
          variant: "destructive",
        })
        return
      }

      // Create a new friendship with a consistent structure
      const friendshipRef = collection(db, "friendships")
      const friendshipData = {
        users: [user.uid, userId].sort(), // Sort to ensure consistent order
        userDetails: {
          [user.uid]: {
            name: userData?.firstName && userData?.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : user.displayName || user.email,
            avatar: userData?.profileImage || userData?.photoURL || user?.photoURL || "/anonymous-user.jpeg",
          },
          [userId]: {
            name: userProfile.firstName && userProfile.lastName
              ? `${userProfile.firstName} ${userProfile.lastName}`
              : userProfile.name || "User",
            avatar: userProfile.photoURL || "/anonymous-user.jpeg",
          },
        },
        createdAt: serverTimestamp(),
        lastInteractionAt: serverTimestamp(),
      }

      await addDoc(friendshipRef, friendshipData)

      // Update the friend request status
      await updateDoc(friendRequestRef, {
        status: "accepted",
        updatedAt: serverTimestamp(),
      })

      // Create notification for the sender
      try {
        await createFriendAcceptedNotification(
          userId,
          user.uid,
          userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : user.displayName || user.email,
          userData?.profileImage || userData?.photoURL || user?.photoURL || "/anonymous-user.jpeg"
        )
      } catch (notifError) {
        console.error("Error creating friend accepted notification:", notifError)
      }

      // Update the UI
      setFriendStatus("accepted")
      
      // Refresh friends list
      const updatedFriends = [...friends, {
        id: userId,
        ...userProfile
      }]
      setFriends(updatedFriends)
      
      toast({
        title: "Friend request accepted",
        description: `You are now friends with ${userProfile.firstName || "User"}.`,
      })
    } catch (error) {
      console.error("Error accepting friend request:", error)
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add this function after handleCancelRequest
  const handleCancelRequest = async () => {
    if (!user) return

    try {
      // Delete the friend request
      const friendRequestRef = doc(db, "friendRequests", `${user.uid}_${userId}`)
      await deleteDoc(friendRequestRef)

      setFriendStatus("none")
      toast({
        title: "Request cancelled",
        description: "Friend request has been cancelled.",
      })
    } catch (error) {
      console.error("Error cancelling friend request:", error)
      toast({
        title: "Error",
        description: "Failed to cancel friend request. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get full name
  const getFullName = (profile) => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`
    }
    return profile?.name || "User"
  }

  // Get initials for avatar
  const getInitials = (profile) => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    }
    if (profile?.name) {
      return profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return "U"
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  // Add this function to handle long press
  const handleLongPress = () => {
    if (friendStatus === "accepted") {
      setShowUnfriend(true)
    }
  }

  // Add this function to handle touch end
  const handleTouchEnd = () => {
    if (unfriendTimeoutRef.current) {
      clearTimeout(unfriendTimeoutRef.current)
    }
  }

  // Add this function to handle touch start
  const handleTouchStart = () => {
    if (friendStatus === "accepted") {
      unfriendTimeoutRef.current = setTimeout(() => {
        setShowUnfriend(true)
      }, 500) // 500ms for long press
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

  if (error) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="text-destructive mb-4 text-5xl">😕</div>
          <h3 className="text-lg font-medium">{error}</h3>
          <p className="text-muted-foreground mt-2">
            The user you're looking for might not exist or you don't have permission to view this profile.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/user">Go Home</Link>
          </Button>
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
          <p className="text-muted-foreground">Please wait while we fetch the profile data.</p>
        </div>
      </PageLayout>
    )
  }

  // Check if users are friends to enable messaging
  const canMessage = friendStatus === "accepted"

  return (
    <PageLayout>
      <div className="relative">
        {/* Enhanced Banner with Profile Info */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 md:p-10 rounded-xl mb-6 relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute top-10 -left-10 w-40 h-40 bg-white/5 rounded-full"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Image */}
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white/90 shadow-lg">
                {userProfile.photoURL ? (
                  <AvatarImage
                    src={userProfile.photoURL || "/placeholder.svg"}
                    alt={getFullName(userProfile)}
                    onError={(e) => {
                      console.error("Error loading profile image:", e)
                    }}
                  />
                ) : (
                  <AvatarFallback className="text-2xl bg-white/20 text-white">
                    {getInitials(userProfile)}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{getFullName(userProfile)}</h1>
                    {userProfile.idNumber && <p className="text-white/80 mt-1">{userProfile.idNumber}</p>}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    {/* Friend Status Button */}
                    <div className="flex items-center gap-2">
                      {friendStatus === "none" && (
                        <Button
                          onClick={handleFriendRequest}
                          className="bg-white text-primary hover:bg-white/90 flex items-center"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Friend
                        </Button>
                      )}

                      {friendStatus === "pending" && (
                        <Button
                          onClick={handleCancelRequest}
                          variant="outline"
                          className="bg-transparent border-white text-white hover:bg-white/20 flex items-center"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel Request
                        </Button>
                      )}

                      {friendStatus === "received" && (
                        <Button
                          onClick={handleAcceptRequest}
                          variant="outline"
                          className="bg-transparent border-white text-white hover:bg-white/20 flex items-center"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Accept Request
                        </Button>
                      )}

                      {friendStatus === "accepted" && (
                        <Button
                          onClick={() => setShowUnfriendDialog(true)}
                          variant="outline"
                          className="bg-transparent border-white text-white hover:bg-white/20 flex items-center"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Friends
                        </Button>
                      )}

                      {friendStatus === "declined" && (
                        <Button
                          variant="outline"
                          disabled
                          className="bg-transparent border-white text-white hover:bg-white/20 flex items-center opacity-70"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Request Declined
                        </Button>
                      )}
                    </div>

                    {/* Message Button */}
                    <Button
                      className={`flex items-center ${
                        friendStatus === "accepted"
                          ? "bg-white/80 text-primary hover:bg-white/90"
                          : "bg-transparent border-white text-white hover:bg-white/20 opacity-70"
                      }`}
                      disabled={friendStatus !== "accepted"}
                      title={friendStatus !== "accepted" ? "You must be friends to message" : ""}
                      asChild={friendStatus === "accepted"}
                    >
                      {friendStatus === "accepted" ? (
                        <Link href={`/user/messages?user=${userProfile.id}`} className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Link>
                      ) : (
                        <span className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Bio */}
                {userProfile.bio && (
                  <p className="text-white/90 mt-2 max-w-2xl">{userProfile.bio || "No bio available"}</p>
                )}
              </div>
            </div>

            {/* Additional Profile Information */}
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

            {/* Stats */}
            <div className="flex gap-6 mt-4 text-sm border-t border-white/20 pt-4">
              <div>
                <span className="font-bold">{posts.length || 0}</span> Posts
              </div>
              <div>
                <span className="font-bold">{friends.length || 0}</span> Friends
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs for Posts and Friends */}
        <Tabs defaultValue="posts" className="mt-6">
          <TabsList className="w-full grid grid-cols-2 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger
              value="posts"
              className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3"
            >
              <FileText className="h-4 w-4" />
              <span>Posts</span>
              {posts.length > 0 && (
                <span className="ml-1.5 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                  {posts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3"
            >
              <Users className="h-4 w-4" />
              <span>Friends</span>
              {friends.length > 0 && (
                <span className="ml-1.5 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                  {friends.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-6 animate-in slide-in-from-bottom-4 duration-300">
            {postsLoading ? (
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
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
                <p className="text-muted-foreground">
                  This user hasn't published any posts yet, or they may be private.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="mt-6 animate-in slide-in-from-bottom-4 duration-300">
            {friendsLoading ? (
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
                      className="bg-muted/20 hover:bg-muted/40 transition-colors rounded-lg p-4 text-center group relative overflow-hidden"
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      {/* Unfriend Button */}
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => handleFriendCardUnfriend(friend)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Friend Content */}
                      <Link
                        href={`/user/profile/${friend.id}`}
                        className="block relative z-10"
                      >
                        <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-primary/10 group-hover:border-primary/30 transition-colors">
                          <AvatarImage
                            src={friend.photoURL || "/placeholder.svg"}
                            alt={`${friend.firstName} ${friend.lastName}`}
                          />
                          <AvatarFallback>
                            {friend.firstName?.[0]}
                            {friend.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium group-hover:text-primary transition-colors text-base">
                          {friend.firstName} {friend.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1.5">
                          {friend.department && (
                            <p className="flex items-center justify-center gap-1.5">
                              <GraduationCap className="h-3.5 w-3.5" />
                              {friend.department}
                            </p>
                          )}
                          {friend.campus && (
                            <p className="flex items-center justify-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {friend.campus}
                            </p>
                          )}
                        </div>
                      </Link>
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
                <h3 className="text-lg font-medium mb-2">No Friends Yet</h3>
                <p className="text-muted-foreground">This user hasn't added any friends yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Friend Card Unfriend Confirmation Dialog */}
      <AlertDialog open={showFriendUnfriendDialog} onOpenChange={setShowFriendUnfriendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unfriend {friendToUnfriend?.firstName || "User"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {friendToUnfriend?.firstName || "User"} from your friends list. You can send them a friend request again in the future.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFriendToUnfriend(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmFriendCardUnfriend}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Unfriend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Original Unfriend Dialog */}
      <AlertDialog open={showUnfriendDialog} onOpenChange={setShowUnfriendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unfriend {commentToDelete?.firstName || "User"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {commentToDelete?.firstName || "User"} from your friends list. You can send them a friend request again in the future.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCommentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnfriend}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Unfriend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}
