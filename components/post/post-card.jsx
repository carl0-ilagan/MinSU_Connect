"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  ThumbsUp,
  Smile,
  Frown,
  Angry,
  MapPin,
  Store,
  Coffee,
  Trash2,
  Edit2,
  X,
  Check,
  Users,
  Link2,
  Facebook,
  Twitter,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { db } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion, arrayRemove, increment, serverTimestamp, onSnapshot, getDoc, collection, addDoc, setDoc } from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import {
  createReactionNotification,
  createCommentNotification,
  createShareNotification,
} from "@/lib/notification-service"
import { Label } from "@/components/ui/label"

// Anonymous user profile image
const ANONYMOUS_PROFILE_IMAGE = "/anonymous-user.jpeg"

// Icons for different place types
const getPlaceIcon = (placeName) => {
  if (!placeName) return <MapPin className="h-3 w-3 text-primary" />

  if (
    placeName.includes("Jollibee") ||
    placeName.includes("McDonald") ||
    placeName.includes("KFC") ||
    placeName.includes("Burger") ||
    placeName.includes("Wendy") ||
    placeName.includes("Chowking") ||
    placeName.includes("Greenwich") ||
    placeName.includes("Shakey") ||
    placeName.includes("Pizza")
  ) {
    return <Store className="h-3 w-3 text-orange-500" />
  } else if (
    placeName.includes("Starbucks") ||
    placeName.includes("Gong Cha") ||
    placeName.includes("Serenitea") ||
    placeName.includes("The Alley") ||
    placeName.includes("Tiger Sugar") ||
    placeName.includes("Macao Imperial") ||
    placeName.includes("Dunkin")
  ) {
    return <Coffee className="h-3 w-3 text-brown-500" />
  } else if (
    placeName.includes("SM") ||
    placeName.includes("Ayala") ||
    placeName.includes("Robinsons") ||
    placeName.includes("Glorietta") ||
    placeName.includes("Trinoma") ||
    placeName.includes("Greenhills") ||
    placeName.includes("Megamall")
  ) {
    return <Store className="h-3 w-3 text-blue-500" />
  } else {
    return <MapPin className="h-3 w-3 text-primary" />
  }
}

export function PostCard({ post }) {
  const [isLiked, setIsLiked] = useState(false)
  const [userReaction, setUserReaction] = useState(null)
  const [showReactions, setShowReactions] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showReactionsDialog, setShowReactionsDialog] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editedCommentText, setEditedCommentText] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [postData, setPostData] = useState(post)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const commentInputRef = useRef(null)
  const shareUrlRef = useRef(null)
  const [reactorsData, setReactorsData] = useState({})
  const [isLoadingReactors, setIsLoadingReactors] = useState(false)
  const previousReactionsRef = useRef(null)
  const [isAnonymousComment, setIsAnonymousComment] = useState(false)
  // New state for reporting
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Set up real-time listener for post updates
  useEffect(() => {
    if (!post.id) return

    const postRef = doc(db, "posts", post.id)
    const unsubscribe = onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setPostData(prev => {
          // Ensure we're using the latest comment list
          const newCommentList = data.commentList || []
          return {
            ...prev,
          ...data,
            commentList: newCommentList,
            comments: newCommentList.length // Use actual length
        }
        })
      }
    }, (error) => {
      console.error("Error listening to post updates:", error)
    })

    return () => unsubscribe()
  }, [post.id])

  // Debug post data
  console.log("Post data:", post)

  // Ensure post has all required properties with defaults
  const safePost = {
    id: postData?.id || 0,
    content: postData?.content || "No content available",
    image: postData?.image || null,
    video: postData?.video || null,
    location: postData?.location || null,
    locationCoords: postData?.locationCoords || null,
    timestamp: postData?.timestamp?.toDate?.() || postData?.createdAt?.toDate?.() || postData?.timestamp || postData?.createdAt,
    likes: postData?.likes || 0,
    comments: postData?.comments || 0,
    commentList: postData?.commentList || [],
    isAnonymous: postData?.isAnonymous || false,
    hidden: postData?.hidden || false,
    reactions: postData?.reactions || {},
    likedBy: postData?.likedBy || [],
    shares: postData?.shares || 0,
    user: {
      id: postData?.user?.id || postData?.userId || "anonymous",
      name: postData?.user?.name || postData?.userName || "Anonymous User",
      avatar:
        postData?.user?.avatar ||
        postData?.userAvatar ||
        postData?.profileImage ||
        postData?.userProfileImage ||
        postData?.photoURL ||
        null,
    },
  }

  // If the post has userProfileImage, use it for the avatar
  if (postData?.userProfileImage) {
    safePost.user.avatar = postData.userProfileImage
  }

  // If the post has firstName and lastName, use them for the name
  if (postData?.firstName && postData?.lastName) {
    safePost.user.name = `${postData.firstName} ${postData.lastName}`
  }

  // Check if the current user has already reacted to this post
  useEffect(() => {
    if (!user) return

    // Check if user is in likedBy array
    const hasLiked = safePost.likedBy?.includes(user.uid)
    setIsLiked(hasLiked)

    // Find user's reaction if any
    const userReaction = safePost.reactions?.[user.uid]
    if (userReaction) {
      setUserReaction(userReaction)
    } else {
      setUserReaction(null)
    }
  }, [user, safePost.likedBy, safePost.reactions])

  const handleReaction = async (reactionType) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to react to posts",
        variant: "destructive",
      })
      return
    }

    try {
      const postRef = doc(db, "posts", safePost.id)
      const postDoc = await getDoc(postRef)
      
      if (!postDoc.exists()) {
        throw new Error("Post not found")
      }

      const postData = postDoc.data()
      const reactions = postData.reactions || {}
      const userReaction = reactions[user.uid]

      // If user already has this reaction, remove it
      if (userReaction === reactionType) {
        // Create a new reactions object without the user's reaction
        const { [user.uid]: removedReaction, ...remainingReactions } = reactions
        
        // Update both reactions and likes in a single operation
        await updateDoc(postRef, {
          reactions: remainingReactions,
          likes: increment(-1)
        })

        // Update local state
        setPostData((prev) => ({
          ...prev,
          reactions: remainingReactions,
          likes: Math.max(0, prev.likes - 1)
        }))
        setUserReaction(null)
        setIsLiked(false)
        return
      }

      // If user has a different reaction or no reaction, update it
      const newReactions = {
        ...reactions,
        [user.uid]: reactionType
      }

      // Only increment likes if this is a new reaction
      const likesIncrement = userReaction ? 0 : 1

      // Update both reactions and likes in a single operation
      await updateDoc(postRef, {
        reactions: newReactions,
        likes: increment(likesIncrement)
      })

      // Create notification if post owner is different from reacting user
      if (postData.userId !== user.uid) {
        const notificationRef = collection(db, "notifications")
        // Use anonymous name if the post is anonymous and the reactor is the post owner
        const reactorName = (postData.isAnonymous && postData.userId === user.uid) ? "Anonymous" : (
          userData?.firstName && userData?.lastName
          ? `${userData.firstName} ${userData.lastName}`
            : userData?.displayName || user?.displayName || user?.email?.split('@')[0] || "User"
        )
        
        // Get count of other reactors
        const otherReactors = Object.keys(reactions).length
        const notificationText = otherReactors > 0
          ? `${reactorName} and ${otherReactors} others reacted to your post`
          : `${reactorName} reacted to your post`

        await addDoc(notificationRef, {
          type: "reaction",
          userId: postData.userId,
          postId: safePost.id,
          postContent: safePost.content,
          reactorId: user.uid,
          reactorName: reactorName,
          reactorPhoto: (postData.isAnonymous && postData.userId === user.uid) ? ANONYMOUS_PROFILE_IMAGE : (
            userData?.profileImage || userData?.photoURL || user?.photoURL || ANONYMOUS_PROFILE_IMAGE
          ),
          reactionType,
          notificationText,
          read: false,
          createdAt: serverTimestamp()
        })
      }

      // Update local state
      setPostData((prev) => ({
        ...prev,
        reactions: newReactions,
        likes: prev.likes + likesIncrement
      }))
      setUserReaction(reactionType)
      setIsLiked(true)

      toast({
        title: "Reaction updated",
        description: `You reacted with ${reactionType}`,
      })
    } catch (error) {
      console.error("Error handling reaction:", error)
      toast({
        title: "Error",
        description: "Failed to add reaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get reaction emoji based on type
  const getReactionEmoji = (type) => {
    switch (type) {
      case "like":
        return "👍"
      case "love":
        return "❤️"
      case "care":
        return "🤗"
      case "haha":
        return "😂"
      case "wow":
        return "😮"
      case "sad":
        return "😢"
      case "angry":
        return "😠"
      default:
        return "👍"
    }
  }

  // Get reaction icon based on type
  const getReactionIcon = (type) => {
    return <span className="text-xl">{getReactionEmoji(type)}</span>
  }

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive",
      })
      return
    }

    // If already liked, unlike the post
    if (isLiked) {
      try {
        // Find the existing reaction
        const existingReaction = safePost.reactions.find((r) => r.userId === user.uid)

        if (existingReaction) {
          const postRef = doc(db, "posts", safePost.id)

          // Remove the reaction from Firestore
          await updateDoc(postRef, {
            likes: increment(-1),
            likedBy: arrayRemove(user.uid),
            reactions: arrayRemove(existingReaction),
          })

          // Update local state
          const updatedReactions = safePost.reactions.filter((r) => r.userId !== user.uid)
          const updatedLikedBy = safePost.likedBy.filter((id) => id !== user.uid)

          setPostData((prev) => ({
            ...prev,
            reactions: updatedReactions,
            likedBy: updatedLikedBy,
            likes: Math.max(0, (prev.likes || 0) - 1),
          }))

          setUserReaction(null)
          setIsLiked(false)
        }
      } catch (error) {
        console.error("Error removing like:", error)
        toast({
          title: "Error",
          description: "Failed to remove like. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      // If not liked, add a like
      try {
        // Create reaction object
        const reactionData = {
          userId: user.uid,
          userName:
            userData?.firstName && userData?.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : user.displayName || user.email.split("@")[0],
          userAvatar: userData?.profileImage || userData?.photoURL || user?.photoURL || null,
          type: "like",
          timestamp: new Date().toISOString(),
        }

        // Update Firestore
        const postRef = doc(db, "posts", safePost.id)
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid),
          reactions: arrayUnion(reactionData),
        })

        // Create notification if the post is not by the current user
        if (safePost.user.id !== user.uid) {
          try {
            await createReactionNotification(
              safePost.user.id,
              safePost.id,
              user.uid,
              reactionData.userName,
              reactionData.userAvatar,
              "like",
            )

            // Show success toast
            toast({
              title: "Like added",
              description: `You liked ${safePost.user.name}'s post`,
            })
          } catch (notifError) {
            console.error("Error creating reaction notification:", notifError)
          }
        }

        // Update local state
        setPostData((prev) => ({
          ...prev,
          reactions: [...(prev.reactions || []).filter((r) => r.userId !== user.uid), reactionData],
          likedBy: [...(prev.likedBy || []).filter((id) => id !== user.uid), user.uid],
          likes: (prev.likes || 0) + 1,
        }))

        setUserReaction("like")
        setIsLiked(true)
      } catch (error) {
        console.error("Error adding like:", error)
        toast({
          title: "Error",
          description: "Failed to add like. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!user || !commentText.trim()) return

    setIsSubmittingComment(true)
    try {
      const postRef = doc(db, "posts", safePost.id)
      
      // Get current post data
      const postDoc = await getDoc(postRef)
      if (!postDoc.exists()) {
        throw new Error("Post not found")
      }

      const postData = postDoc.data()
      const currentCommentList = postData.commentList || []

      // Generate a unique ID using timestamp and random string
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const commentData = {
        id: uniqueId,
        content: commentText.trim(),
        userId: user.uid,
        commenterId: user.uid,
        userName: isAnonymousComment ? "Anonymous" : (
          userData?.firstName && userData?.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData?.displayName || user?.displayName || user?.email?.split('@')[0] || "User"
        ),
        userAvatar: isAnonymousComment ? ANONYMOUS_PROFILE_IMAGE : (
          userData?.photoURL || user?.photoURL || ANONYMOUS_PROFILE_IMAGE
        ),
        timestamp: new Date().toISOString(),
        reactions: {},
        likes: 0,
        isAnonymous: isAnonymousComment
      }

      // Create new array with new comment
      const updatedCommentList = [...currentCommentList, commentData]

      // Update Firestore
      await updateDoc(postRef, {
        commentList: updatedCommentList,
        comments: updatedCommentList.length, // Use actual length
        lastCommentAt: serverTimestamp()
      })

      // Update local state
      setPostData(prev => ({
        ...prev,
        commentList: updatedCommentList,
        comments: updatedCommentList.length
      }))

      // Create notification if needed
      if (safePost.user.id !== user.uid) {
        const notificationRef = collection(db, "notifications")
        const commenterName = isAnonymousComment ? "Anonymous" : (
          userData?.firstName && userData?.lastName 
          ? `${userData.firstName} ${userData.lastName}`
            : userData?.displayName || user?.displayName || user?.email?.split('@')[0] || "User"
        )

        await addDoc(notificationRef, {
          type: "comment",
          userId: safePost.user.id,
          postId: safePost.id,
          postContent: safePost.content,
          commentId: commentData.id,
          commentContent: commentText.trim(),
          commenterId: user.uid,
          commenterName: commenterName,
          commenterPhoto: isAnonymousComment ? ANONYMOUS_PROFILE_IMAGE : (
            userData?.profileImage || userData?.photoURL || user?.photoURL || ANONYMOUS_PROFILE_IMAGE
          ),
          notificationText: `${commenterName} commented on your post`,
          read: false,
          createdAt: serverTimestamp()
        })
      }

      setCommentText("")
      setIsAnonymousComment(false)
      toast({
        title: "Comment added",
        description: `Your ${isAnonymousComment ? "anonymous " : ""}comment has been posted successfully`,
        className: "z-[100]",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
        className: "z-[100]",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleEditComment = (comment) => {
    if (!user || user.uid !== comment.userId) {
      toast({
        title: "Permission denied",
        description: "You can only edit your own comments",
        variant: "destructive",
        className: "z-[100]",
      })
      return
    }
    setEditingCommentId(comment.id)
    setEditedCommentText(comment.content)
  }

  const handleDeleteComment = (comment) => {
    if (!user || user.uid !== comment.userId) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own comments",
        variant: "destructive",
        className: "z-[100]",
      })
      return
    }
    setCommentToDelete(comment)
    setShowDeleteDialog(true)
  }

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return

    try {
      const postRef = doc(db, "posts", safePost.id)
      
      // Get the current post data
      const postDoc = await getDoc(postRef)
      if (!postDoc.exists()) {
        throw new Error("Post not found")
      }

      const postData = postDoc.data()
      const currentCommentList = postData.commentList || []

      // Create new array without the deleted comment
      const updatedCommentList = currentCommentList.filter(
        comment => comment.id !== commentToDelete.id
      )

      // Update Firestore with the new comment list
      await updateDoc(postRef, {
        commentList: updatedCommentList,
        comments: updatedCommentList.length // Use actual length instead of increment
      })

      // Update local state immediately
      setPostData(prev => ({
        ...prev,
        commentList: updatedCommentList,
        comments: updatedCommentList.length
      }))

      // Close dialog and clear state
      setShowDeleteDialog(false)
      setCommentToDelete(null)

      // Force a refresh of the post data
      const updatedPostDoc = await getDoc(postRef)
      if (updatedPostDoc.exists()) {
        const updatedData = updatedPostDoc.data()
        setPostData(prev => ({
          ...prev,
          commentList: updatedData.commentList || [],
          comments: updatedData.commentList?.length || 0
        }))
      }

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
        className: "z-[100]",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
        className: "z-[100]",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditedCommentText("")
  }

  const handleSaveEditedComment = async (commentId) => {
    if (!editedCommentText.trim()) {
      toast({
        title: "Empty comment",
        description: "Comment cannot be empty",
        variant: "destructive",
        className: "z-[100]",
      })
      return
    }

    try {
      const postRef = doc(db, "posts", safePost.id)
      
      // Get the current post data
      const postDoc = await getDoc(postRef)
      if (!postDoc.exists()) {
        throw new Error("Post not found")
      }

      const postData = postDoc.data()
      const currentCommentList = postData.commentList || []

      // Find the comment to edit
      const commentIndex = currentCommentList.findIndex(c => c.id === commentId)
      if (commentIndex === -1) {
        throw new Error("Comment not found")
      }

      // Create updated comment
      const updatedComment = {
        ...currentCommentList[commentIndex],
        content: editedCommentText.trim(),
        edited: true,
        editedAt: new Date().toISOString(),
      }

      // Create new array with updated comment
      const updatedCommentList = [...currentCommentList]
      updatedCommentList[commentIndex] = updatedComment

      // Update Firestore
      await updateDoc(postRef, {
        commentList: updatedCommentList
      })

      // Update local state
      setPostData(prev => ({
        ...prev,
        commentList: updatedCommentList
      }))

      // Reset editing state
      setEditingCommentId(null)
      setEditedCommentText("")

      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully",
        className: "z-[100]",
      })
    } catch (error) {
      console.error("Error updating comment:", error)
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
        className: "z-[100]",
      })
    }
  }

  const handleShare = async (platform = "copy") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to share posts",
        variant: "destructive",
      })
      return
    }

    try {
      // Create share data
      const shareData = {
        userId: user.uid,
        userName:
          userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : user.displayName || user.email.split("@")[0],
        userAvatar: userData?.profileImage || userData?.photoURL || user?.photoURL || null,
        platform: platform,
        timestamp: new Date().toISOString(),
      }

      // Update Firestore
      const postRef = doc(db, "posts", safePost.id)
      await updateDoc(postRef, {
        shares: increment(1),
        shareList: arrayUnion(shareData),
      })

      // Create notification if the post is not by the current user
      if (safePost.user.id !== user.uid) {
        try {
          await createShareNotification(
            safePost.user.id,
            safePost.id,
            user.uid,
            shareData.userName,
            shareData.userAvatar,
          )
        } catch (notifError) {
          console.error("Error creating share notification:", notifError)
        }
      }

      // Update local state
      setPostData((prev) => ({
        ...prev,
        shares: (prev.shares || 0) + 1,
        shareList: [...(prev.shareList || []), shareData],
      }))

      // Handle different share platforms
      if (platform === "copy") {
        // Copy link to clipboard
        if (shareUrlRef.current) {
          shareUrlRef.current.select()
          document.execCommand("copy")
          toast({
            title: "Link copied",
            description: "Post link has been copied to clipboard",
          })
        }
      } else if (platform === "facebook") {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          `${window.location.origin}/user/post/${safePost.id}`,
        )}`
        window.open(url, "_blank")
      } else if (platform === "twitter") {
        const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          `${window.location.origin}/user/post/${safePost.id}`,
        )}&text=${encodeURIComponent(safePost.content.substring(0, 100))}`
        window.open(url, "_blank")
      }

      setShowShareDialog(false)
    } catch (error) {
      console.error("Error sharing post:", error)
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  useEffect(() => {
    // Skip if reactions haven't changed
    if (JSON.stringify(previousReactionsRef.current) === JSON.stringify(safePost.reactions)) {
      return
    }

    const fetchReactorsData = async () => {
      const reactionEntries = Object.entries(safePost.reactions || {})
      const userIds = reactionEntries.map(([userId]) => userId)

      if (userIds.length === 0) {
        setReactorsData({})
        setIsLoadingReactors(false)
        return
      }

      setIsLoadingReactors(true)
      const usersDataToFetch = []

      // Only fetch data for users we don't already have
      userIds.forEach(userId => {
        if (!reactorsData[userId]) {
          usersDataToFetch.push(userId)
        }
      })

      if (usersDataToFetch.length === 0) {
        setIsLoadingReactors(false)
        return
      }

      try {
        const fetchedUsersData = {}
        await Promise.all(
          usersDataToFetch.map(async (userId) => {
            const userDoc = await getDoc(doc(db, "users", userId))
            if (userDoc.exists()) {
              fetchedUsersData[userId] = userDoc.data()
            }
          })
        )

        setReactorsData(prevData => ({
          ...prevData,
          ...fetchedUsersData
        }))
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoadingReactors(false)
      }
    }

    fetchReactorsData()
    // Update the ref with current reactions
    previousReactionsRef.current = safePost.reactions
  }, [safePost.reactions]) // Only depend on safePost.reactions

  // Add this function to get unique reaction types with counts
  const getUniqueReactions = () => {
    if (!safePost.reactions) return []
    
    const reactionCounts = {}
    Object.values(safePost.reactions).forEach(type => {
      reactionCounts[type] = (reactionCounts[type] || 0) + 1
    })
    
    return Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1]) // Sort by count
      .slice(0, 3) // Take top 3
      .map(([type]) => type)
  }

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ""
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  // Update the getReactionSummary function to handle anonymous posts
  const getReactionSummary = () => {
    if (!safePost.reactions || Object.keys(safePost.reactions).length === 0) return null;

    const reactionEntries = Object.entries(safePost.reactions);
    const totalReactors = reactionEntries.length;

    if (totalReactors === 0) return null;

    // Find the data for the first reactor whose data is available
    let firstReactorWithData = null;
    let firstReactorIdWithData = null;

    for (const [userId, reactionType] of reactionEntries) {
      if (reactorsData[userId]) {
        firstReactorWithData = reactorsData[userId];
        firstReactorIdWithData = userId;
        break;
      }
    }

    const remainingCount = totalReactors - 1;

    // If data for at least one reactor is available, use it for the summary
    if (firstReactorWithData) {
      // Check if the post is anonymous and the reactor is the post owner
      const isAnonymousReactor = safePost.isAnonymous && firstReactorIdWithData === safePost.user.id;
      
      const reactorName = isAnonymousReactor ? "Anonymous" : (
        firstReactorWithData.firstName && firstReactorWithData.lastName
        ? `${firstReactorWithData.firstName} ${firstReactorWithData.lastName}`
          : firstReactorWithData.displayName || "Unknown User"
      );

      if (remainingCount === 0) {
        return reactorName;
      } else if (remainingCount === 1) {
        return `${reactorName} and 1 other`;
      } else {
        return `${reactorName} and ${remainingCount} others`;
      }
    } else {
      return `${totalReactors} ${totalReactors === 1 ? 'reaction' : 'reactions'}`;
    }
  };

  // Update the reactions dialog to handle anonymous posts
  const renderReactionUser = (userId, reactionType) => {
    // Check if the post is anonymous and the reactor is the post owner
    const isAnonymousReactor = safePost.isAnonymous && userId === safePost.user.id;
    const reactorData = isAnonymousReactor ? null : reactorsData[userId];

    const reactorName = isAnonymousReactor ? "Anonymous" : (
      reactorData?.firstName && reactorData?.lastName
        ? `${reactorData.firstName} ${reactorData.lastName}`
        : reactorData?.displayName || "Unknown User"
    );

    const reactorPhoto = isAnonymousReactor ? ANONYMOUS_PROFILE_IMAGE : (
      reactorData?.profileImage || reactorData?.photoURL || ANONYMOUS_PROFILE_IMAGE
    );

    return (
      <div key={userId} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={reactorPhoto}
              alt={reactorName}
              onError={(e) => {
                e.target.src = "/placeholder.svg"
              }}
            />
            <AvatarFallback>{reactorName ? getUserInitials(reactorName) : "U"}</AvatarFallback>
          </Avatar>
          <div>
            {isAnonymousReactor ? (
              <div className="font-medium text-sm">Anonymous</div>
            ) : (
              <Link href={`/user/profile/${userId}`} className="font-medium text-sm hover:underline">
                {reactorName}
              </Link>
            )}
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(safePost.timestamp), { addSuffix: true })}
            </div>
          </div>
        </div>
        <div className="text-xl">
          {getReactionEmoji(reactionType)}
        </div>
      </div>
    );
  };

  // Update the comment rendering section
  const renderComment = (comment, i) => {
    // Generate a unique key for this comment
    const commentKey = `comment-${comment?.id || i}-${comment?.timestamp || Date.now()}-${i}`

    const safeComment = {
      id: comment?.id || `comment-${i}-${Date.now()}`,
      content: comment?.content || "No comment content",
      timestamp: comment?.timestamp || new Date().toISOString(),
      edited: comment?.edited || false,
      editedAt: comment?.editedAt,
      isAnonymous: comment?.isAnonymous || false,
      userId: comment?.userId || comment?.user?.id || 0,
      user: {
        id: comment?.userId || comment?.user?.id || 0,
        name: comment?.isAnonymous ? "Anonymous" : (
          comment?.userName || 
          comment?.user?.name || 
          "Anonymous User"
        ),
        avatar: comment?.isAnonymous ? ANONYMOUS_PROFILE_IMAGE : (
          comment?.userAvatar || 
          comment?.user?.avatar || 
          ANONYMOUS_PROFILE_IMAGE
        ),
      },
    }

    const isCommentOwner = user && user.uid === safeComment.userId

    return (
      <div key={commentKey} className="flex gap-2">
        <Avatar className="h-8 w-8 border-2 border-primary/10">
          <AvatarImage
            src={safeComment.user.avatar}
            alt={safeComment.user.name}
            onError={(e) => {
              e.target.src = "/placeholder.svg"
            }}
          />
          <AvatarFallback>{getUserInitials(safeComment.user.name)}</AvatarFallback>
        </Avatar>
        <div className="bg-muted rounded-lg p-2 flex-1">
          <div className="flex justify-between items-start">
            {safeComment.isAnonymous ? (
              <span className="font-semibold text-sm">Anonymous</span>
            ) : (
              <Link
                href={`/user/profile/${safeComment.userId}`}
                className="font-semibold text-sm hover:underline"
              >
                {safeComment.user.name}
              </Link>
            )}
            {isCommentOwner && editingCommentId !== safeComment.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleEditComment(safeComment)}>
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteComment(safeComment)}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {editingCommentId === safeComment.id ? (
            <div className="mt-1">
              <Textarea
                value={editedCommentText}
                onChange={(e) => setEditedCommentText(e.target.value)}
                className="min-h-[60px] text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 rounded-full"
                  onClick={handleCancelEdit}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2 rounded-full"
                  onClick={() => handleSaveEditedComment(safeComment.id)}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm">{safeComment.content}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                {formatDistanceToNow(new Date(safeComment.timestamp), { addSuffix: true })}
                {safeComment.edited && <span className="italic">(edited)</span>}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Handle reporting a post
  const handleReportPost = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to report posts",
        variant: "destructive",
      });
      return;
    }

    try {
      const postRef = doc(db, 'posts', post.id);
      
      // Create a report document in a separate reports collection
      const reportsCollectionRef = collection(db, 'reports');
      await addDoc(reportsCollectionRef, {
        reporterId: user.uid,
        reason: reportReason.trim(),
        reportedAt: serverTimestamp(),
        postId: post.id,
        postUserId: post.userId
      });

      // Update the post document
      await updateDoc(postRef, {
        isReported: true
      });

      toast({
        title: "Post reported",
        description: "Thank you for reporting. The post will be reviewed by administrators.",
      });
      
      setShowReportDialog(false);
      setReportReason('');
    } catch (error) {
      console.error('Error reporting post:', error);
      toast({
        title: "Error",
        description: "Failed to report post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-4 overflow-hidden animate-in rounded-xl shadow-md border-0">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Avatar className="border-2 border-primary/10">
              {safePost.isAnonymous ? (
                <AvatarImage src={ANONYMOUS_PROFILE_IMAGE || "/placeholder.svg"} alt="Anonymous" />
              ) : (
                <>
                  <AvatarImage
                    src={safePost.user.avatar || "/placeholder.svg"}
                    alt={safePost.user.name}
                    onError={(e) => {
                      console.error("Error loading avatar image:", e)
                      e.target.src = "/placeholder.svg"
                    }}
                  />
                  <AvatarFallback>{getUserInitials(safePost.user.name)}</AvatarFallback>
                </>
              )}
            </Avatar>
            <div>
              {safePost.isAnonymous ? (
                <div className="font-semibold">Anonymous</div>
              ) : (
                <Link href={`/user/profile/${safePost.user.id}`} className="font-semibold hover:underline">
                  {safePost.user.name}
                </Link>
              )}
              <p className="text-xs text-muted-foreground">
                {formatTimestamp(safePost.timestamp)}
                {safePost.location && (
                  <span className="flex items-center gap-1 mt-0.5">
                    {getPlaceIcon(safePost.location)}
                    <span className="text-primary/80">{safePost.location}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="animate-in rounded-xl p-1">
              <DropdownMenuItem className="rounded-lg cursor-pointer">Save Post</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer">Hide Post</DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Add Report Post Menu Item */}
              <DropdownMenuItem 
                className="text-destructive rounded-lg cursor-pointer"
                onClick={() => setShowReportDialog(true)}
              >
                Report Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="mb-3">{safePost.content}</p>
        {safePost.image && (
          <div className="relative rounded-lg overflow-hidden mb-2">
            <img
              src={safePost.image || "/placeholder.svg"}
              alt="Post image"
              className="w-full object-cover max-h-[500px]"
              onError={(e) => {
                console.error("Error loading post image:", e)
                e.target.src = "/placeholder.svg"
              }}
            />
          </div>
        )}
        {safePost.video && (
          <div className="relative rounded-lg overflow-hidden mb-2">
            <video
              src={safePost.video}
              controls
              className="w-full object-cover max-h-[500px]"
              onError={(e) => {
                console.error("Error loading video:", e)
              }}
            />
          </div>
        )}
        <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            {Object.keys(safePost.reactions || {}).length > 0 && !isLoadingReactors && (
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  {getUniqueReactions().map((type, index) => (
                    <div key={`${type}-${index}`} className="text-sm">
                      {getReactionEmoji(type)}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setShowReactionsDialog(true)}
                >
                  <span>{getReactionSummary()}</span>
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {safePost.commentList && safePost.commentList.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto text-muted-foreground hover:text-foreground hover:bg-transparent"
                  >
                    {safePost.commentList.length} {safePost.commentList.length === 1 ? 'comment' : 'comments'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md animate-in rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Comments</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {safePost.commentList && safePost.commentList.length > 0 ? (
                      <div className="space-y-4 my-4">
                        {safePost.commentList.map((comment, i) => renderComment(comment, i))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No comments yet. Be the first to comment!
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleCommentSubmit} className="flex gap-2 items-start mt-2">
                    <Avatar className="h-8 w-8 border-2 border-primary/10">
                      <AvatarImage
                        src={
                          isAnonymousComment ? ANONYMOUS_PROFILE_IMAGE : (
                          userData?.profileImage ||
                          userData?.photoURL ||
                          user?.photoURL ||
                            "/abstract-geometric-shapes.png"
                          )
                        }
                        alt={isAnonymousComment ? "Anonymous" : (userData?.firstName || "Your avatar")}
                        onError={(e) => {
                          e.target.src = "/placeholder.svg"
                        }}
                      />
                      <AvatarFallback>
                        {isAnonymousComment ? "A" : (userData?.firstName?.charAt(0) || user?.email?.charAt(0) || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Write a comment..."
                        className="min-h-[80px] rounded-lg"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="anonymous-comment"
                            checked={isAnonymousComment}
                            onChange={(e) => setIsAnonymousComment(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="anonymous-comment" className="text-sm text-muted-foreground">
                            Comment anonymously
                          </label>
                        </div>
                      <Button
                        type="submit"
                          className="rounded-full"
                        disabled={!commentText.trim() || isSubmittingComment}
                      >
                        {isSubmittingComment ? "Posting..." : "Post Comment"}
                      </Button>
                      </div>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            {safePost.shares > 0 && <span className="text-muted-foreground">{safePost.shares} shares</span>}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-0 border-t">
        <div className="grid grid-cols-3 w-full">
          <div className="relative">
            <Button
              variant="ghost"
              className={`w-full rounded-none h-12 ${isLiked ? "text-primary" : ""}`}
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
              onClick={() => userReaction ? handleReaction(userReaction) : handleReaction("like")}
            >
              {userReaction ? (
                <span className="text-xl mr-2">{getReactionEmoji(userReaction)}</span>
              ) : (
                <ThumbsUp className="h-5 w-5 mr-2" />
              )}
              {userReaction ? userReaction.charAt(0).toUpperCase() + userReaction.slice(1) : "Like"}
            </Button>
            {showReactions && (
              <div
                className="absolute bottom-full left-0 bg-background border rounded-full p-1 flex gap-1 shadow-lg animate-in"
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
              >
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleReaction("like")}>
                  <span className="text-xl">👍</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleReaction("love")}>
                  <span className="text-xl">❤️</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleReaction("care")}>
                  <span className="text-xl">🤗</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleReaction("haha")}>
                  <span className="text-xl">😂</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleReaction("wow")}>
                  <span className="text-xl">😮</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleReaction("sad")}>
                  <span className="text-xl">😢</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleReaction("angry")}>
                  <span className="text-xl">😠</span>
                </Button>
              </div>
            )}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full rounded-none h-12">
                <MessageCircle className="h-5 w-5 mr-2" />
                Comment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md animate-in rounded-xl">
              <DialogHeader>
                <DialogTitle>Comments</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                {safePost.commentList && safePost.commentList.length > 0 ? (
                  <div className="space-y-4 my-4">
                    {safePost.commentList.map((comment, i) => renderComment(comment, i))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
              <form onSubmit={handleCommentSubmit} className="flex gap-2 items-start mt-2">
                <Avatar className="h-8 w-8 border-2 border-primary/10">
                  <AvatarImage
                    src={
                      isAnonymousComment ? ANONYMOUS_PROFILE_IMAGE : (
                        userData?.profileImage || 
                        userData?.photoURL || 
                        user?.photoURL || 
                        "/abstract-geometric-shapes.png"
                      )
                    }
                    alt={isAnonymousComment ? "Anonymous" : (userData?.firstName || "Your avatar")}
                    onError={(e) => {
                      e.target.src = "/placeholder.svg"
                    }}
                  />
                  <AvatarFallback>
                    {isAnonymousComment ? "A" : (userData?.firstName?.charAt(0) || user?.email?.charAt(0) || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Write a comment..."
                    className="min-h-[80px] rounded-lg"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="anonymous-comment"
                        checked={isAnonymousComment}
                        onChange={(e) => setIsAnonymousComment(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="anonymous-comment" className="text-sm text-muted-foreground">
                        Comment anonymously
                      </label>
                    </div>
                  <Button
                    type="submit"
                      className="rounded-full"
                    disabled={!commentText.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? "Posting..." : "Post Comment"}
                  </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" className="w-full rounded-none h-12" onClick={() => setShowShareDialog(true)}>
            <Share className="h-5 w-5 mr-2" />
            Share
          </Button>
        </div>
      </CardFooter>

      {/* Reactions Dialog - Visible to everyone */}
      <Dialog open={showReactionsDialog} onOpenChange={setShowReactionsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Reactions
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoadingReactors ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading reactions...
              </div>
            ) : safePost.reactions && Object.keys(safePost.reactions).length > 0 ? (
              <div className="space-y-3 py-2">
                {Object.entries(safePost.reactions).map(([userId, reactionType]) => 
                  renderReactionUser(userId, reactionType)
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No reactions yet
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setShowReactionsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Post</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Share this post with others:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  ref={shareUrlRef}
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/user/post/${safePost.id}`}
                  readOnly
                  className="flex-1 p-2 text-sm border rounded-md bg-muted"
                />
                <Button size="sm" onClick={() => handleShare("copy")}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground mb-1">Share on social media:</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => handleShare("facebook")}>
                  <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                  Facebook
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => handleShare("twitter")}>
                  <Twitter className="h-4 w-4 mr-2 text-blue-400" />
                  Twitter
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this comment? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-full">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteComment} className="rounded-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Post Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>Please provide a reason for reporting this post.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
               {/* Optionally display basic post info here */}
              <p className="text-sm text-muted-foreground truncate">{safePost.content.substring(0, 50)}{safePost.content.length > 50 ? '...' : ''}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-reason">Reason for reporting</Label>
              <Textarea
                id="report-reason"
                placeholder="Explain why you are reporting this post..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowReportDialog(false)}
              disabled={isSubmittingReport}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReportPost}
              disabled={!reportReason.trim() || isSubmittingReport}
            >
              {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
