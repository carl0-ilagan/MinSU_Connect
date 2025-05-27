"use client"

import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Heart,
  MessageCircle,
  CheckCircle,
  XCircle,
  Bell,
  UserPlus,
  UserCheck,
  Share,
  ThumbsUp,
  Smile,
  Frown,
  Angry,
} from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function NotificationItem({ notification, onAction, isDropdown = false }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const getIcon = () => {
    switch (notification.type) {
      case "like":
        return <ThumbsUp className="h-4 w-4 text-primary" />
      case "reaction":
        if (notification.reactionType === "love") return <Heart className="h-4 w-4 text-red-500" />
        if (notification.reactionType === "happy") return <Smile className="h-4 w-4 text-yellow-500" />
        if (notification.reactionType === "sad") return <Frown className="h-4 w-4 text-blue-500" />
        if (notification.reactionType === "angry") return <Angry className="h-4 w-4 text-orange-500" />
        return <ThumbsUp className="h-4 w-4 text-primary" />
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "declined":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "friendRequest":
        return <UserPlus className="h-4 w-4 text-primary" />
      case "friendAccepted":
        return <UserCheck className="h-4 w-4 text-green-500" />
      case "share":
        return <Share className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getMessage = () => {
    switch (notification.type) {
      case "like":
        return (
          <span>
            <Link href={`/user/profile/${notification.user.id}`} className="font-semibold hover:underline">
              {notification.user.name}
            </Link>{" "}
            liked your post
          </span>
        )
      case "reaction":
        // Format for multiple reactions
        if (notification.otherUsers && notification.otherUsers.length > 0) {
          return (
            <span>
              <Link href={`/user/profile/${notification.user.id}`} className="font-semibold hover:underline">
                {notification.user.name}
              </Link>{" "}
              and{" "}
              <span className="font-semibold">
                {notification.otherUsers.length} {notification.otherUsers.length === 1 ? "other" : "others"}
              </span>{" "}
              reacted to your post
            </span>
          )
        } else {
          const reactionName = notification.reactionType
            ? notification.reactionType.charAt(0).toUpperCase() + notification.reactionType.slice(1)
            : "Like"
          return (
            <span>
              <Link href={`/user/profile/${notification.user.id}`} className="font-semibold hover:underline">
                {notification.user.name}
              </Link>{" "}
              reacted with {reactionName} to your post
            </span>
          )
        }
      case "comment":
        // Format for multiple comments
        if (notification.otherUsers && notification.otherUsers.length > 0) {
          return (
            <span>
              <Link href={`/user/profile/${notification.user.id}`} className="font-semibold hover:underline">
                {notification.user.name}
              </Link>{" "}
              and{" "}
              <span className="font-semibold">
                {notification.otherUsers.length} {notification.otherUsers.length === 1 ? "other" : "others"}
              </span>{" "}
              commented on your post
            </span>
          )
        } else {
          return (
            <span>
              <Link href={`/user/profile/${notification.user.id}`} className="font-semibold hover:underline">
                {notification.user.name}
              </Link>{" "}
              commented on your post: "{notification.content}"
            </span>
          )
        }
      case "approved":
        return <span>Your post has been approved and is now visible to the community</span>
      case "declined":
        return <span>Your post was declined. Reason: "{notification.content}"</span>
      case "friendRequest":
        return (
          <span>
            <Link href={`/user/profile/${notification.user.id}`} className="font-semibold hover:underline">
              {notification.user.name}
            </Link>{" "}
            sent you a friend request
          </span>
        )
      case "friendAccepted":
        return (
          <span>
            <Link href={`/user/profile/${notification.user.id}`} className="font-semibold hover:underline">
              {notification.user.name}
            </Link>{" "}
            accepted your friend request
          </span>
        )
      case "share":
        return (
          <span>
            <Link href={`/user/profile/${notification.user.id}`} className="font-semibold hover:underline">
              {notification.user.name}
            </Link>{" "}
            shared your post
          </span>
        )
      default:
        return <span>{notification.content}</span>
    }
  }

  const handleMarkAsRead = async () => {
    if (!notification.id) return

    try {
      const notifRef = doc(db, "notifications", notification.id)
      await updateDoc(notifRef, { read: true })

      if (onAction) {
        onAction({ type: "markAsRead", notificationId: notification.id })
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleAcceptFriendRequest = async () => {
    if (!notification.requestId) return

    setIsProcessing(true)
    try {
      // Update the friend request status
      const requestRef = doc(db, "friendRequests", notification.requestId)
      await updateDoc(requestRef, { status: "accepted" })

      // Mark notification as read
      if (notification.id) {
        const notifRef = doc(db, "notifications", notification.id)
        await updateDoc(notifRef, { read: true })
      }

      toast({
        title: "Friend request accepted",
        description: `You are now friends with ${notification.user.name}`,
      })

      if (onAction) {
        onAction({
          type: "friendRequestAccepted",
          notificationId: notification.id,
          requestId: notification.requestId,
          userId: notification.user.id,
        })
      }
    } catch (error) {
      console.error("Error accepting friend request:", error)
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeclineFriendRequest = async () => {
    if (!notification.requestId) return

    setIsProcessing(true)
    try {
      // Delete the friend request
      const requestRef = doc(db, "friendRequests", notification.requestId)
      await deleteDoc(requestRef)

      // Mark notification as read
      if (notification.id) {
        const notifRef = doc(db, "notifications", notification.id)
        await updateDoc(notifRef, { read: true })
      }

      toast({
        title: "Friend request declined",
        description: `Friend request from ${notification.user.name} was declined`,
      })

      if (onAction) {
        onAction({
          type: "friendRequestDeclined",
          notificationId: notification.id,
          requestId: notification.requestId,
          userId: notification.user.id,
        })
      }
    } catch (error) {
      console.error("Error declining friend request:", error)
      toast({
        title: "Error",
        description: "Failed to decline friend request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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

  return (
    <Card
      className={`p-4 mb-2 border-l-4 ${notification.read ? "border-l-transparent" : "border-l-primary"} animate-in ${
        isDropdown ? "border-0 border-l-0 border-b border-b-border rounded-none mb-0 w-full" : ""
      }`}
      onClick={!notification.read ? handleMarkAsRead : undefined}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 relative">
          {notification.user ? (
            <Avatar className={`${isDropdown ? "h-8 w-8" : "h-10 w-10"} border-2 border-primary/10`}>
              <AvatarImage
                src={notification.user.avatar || "/placeholder.svg"}
                alt={notification.user.name}
                onError={(e) => {
                  e.target.src = "/placeholder.svg"
                }}
              />
              <AvatarFallback>{getUserInitials(notification.user.name)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">{getIcon()}</div>
          )}

          {/* Icon overlay in bottom right of avatar */}
          {notification.user && (
            <div
              className={`absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-border ${
                isDropdown ? "scale-75 -bottom-0.5 -right-0.5" : ""
              }`}
            >
              <div className="h-5 w-5 rounded-full flex items-center justify-center bg-primary/10">{getIcon()}</div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div
            className={`flex flex-col ${isDropdown ? "text-sm" : "sm:flex-row sm:items-center sm:justify-between"} gap-1`}
          >
            <div>{getMessage()}</div>
            <div className={`text-xs text-muted-foreground ${isDropdown ? "text-[10px]" : ""}`}>
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
            </div>
          </div>

          {notification.type === "declined" && (
            <div className="mt-2">
              <Button size="sm" variant="outline">
                Edit and Resubmit
              </Button>
            </div>
          )}

          {notification.type === "friendRequest" && (
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAcceptFriendRequest()
                }}
                disabled={isProcessing}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeclineFriendRequest()
                }}
                disabled={isProcessing}
              >
                Decline
              </Button>
            </div>
          )}

          {notification.postId && (
            <div className="mt-2">
              <Link href={`/user/post/${notification.postId}`} className="text-sm text-primary hover:underline">
                View Post
              </Link>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
