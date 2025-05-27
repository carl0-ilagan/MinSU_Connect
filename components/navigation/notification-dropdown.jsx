"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, getDocs, writeBatch, getDoc } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) return

    const notificationsRef = collection(db, "notifications")
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = []
      let unread = 0

      snapshot.forEach((doc) => {
        const notification = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }
        newNotifications.push(notification)
        if (!notification.read) unread++
      })

      setNotifications(newNotifications)
      setUnreadCount(unread)
    })

    return () => unsubscribe()
  }, [user])

  const handleNotificationClick = async (notification) => {
    try {
      // Check if the post exists before redirecting
      if (notification.postId) {
        const postRef = doc(db, "posts", notification.postId)
        const postDoc = await getDoc(postRef)
        
        if (!postDoc.exists()) {
          // If post doesn't exist, mark notification as read and show error
          if (!notification.read) {
            const notificationRef = doc(db, "notifications", notification.id)
            await updateDoc(notificationRef, {
              read: true,
              readAt: new Date(),
              status: "post_deleted"
            })
          }
          toast.error("This post has been deleted or is no longer available")
          return
        }

        // If post exists, proceed with marking as read and navigation
        if (!notification.read) {
          const notificationRef = doc(db, "notifications", notification.id)
          await updateDoc(notificationRef, {
            read: true,
            readAt: new Date()
          })
        }

        // For all post-related notifications, redirect to my-posts page with post ID
        if (["reaction", "comment", "post_reported", "report_reviewed", "post_violation", 
             "comment_reviewed", "reply_reviewed", "report_action", "content_warning",
             "admin_response", "admin_feedback", "admin_reply", "admin_edit"].includes(notification.type)) {
          router.push(`/user/my-posts?postId=${notification.postId}`)
        } else {
          // For other notifications, use the original link
          const content = getNotificationContent(notification)
          if (content.link && content.link !== "#") {
            router.push(content.link)
          } else {
            toast.error("Invalid notification link")
          }
        }
      } else {
        // Handle notifications without postId (like friend requests)
        if (!notification.read) {
          const notificationRef = doc(db, "notifications", notification.id)
          await updateDoc(notificationRef, {
            read: true,
            readAt: new Date()
          })
        }

        const content = getNotificationContent(notification)
        if (content.link && content.link !== "#") {
          router.push(content.link)
        }
      }
    } catch (error) {
      console.error("Error handling notification click:", error)
      toast.error("An error occurred while processing the notification")
    }
  }

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return

    const batch = writeBatch(db)
    notifications.forEach((notification) => {
      if (!notification.read) {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.update(notificationRef, {
          read: true,
          readAt: new Date()
        })
      }
    })

    try {
      await batch.commit()
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  const getNotificationContent = (notification) => {
    // Add error handling for missing postId
    if (notification.type !== "friend_request" && !notification.postId) {
      return {
        icon: "❌",
        text: "Invalid notification: Missing post reference",
        photo: null,
        link: "#"
      }
    }

    switch (notification.type) {
      case "reaction":
        return {
          icon: "❤️",
          text: notification.notificationText || "Someone reacted to your post",
          photo: notification.reactorPhoto,
          link: notification.postId ? `/user/post/${notification.postId}` : "#"
        }
      case "comment":
        return {
          icon: "💬",
          text: notification.notificationText || "Someone commented on your post",
          photo: notification.commenterPhoto,
          link: notification.postId ? `/user/post/${notification.postId}` : "#"
        }
      case "friend_request":
        return {
          icon: "👋",
          text: `${notification.senderName || "Someone"} sent you a friend request`,
          photo: notification.senderPhoto,
          link: notification.senderId ? `/user/profile/${notification.senderId}` : "#"
        }
      case "post_reported":
        return {
          icon: "⚠️",
          text: `Your post was reported by ${notification.reporterName || "someone"}`,
          photo: notification.reporterPhoto,
          link: notification.postId ? `/user/my-posts?postId=${notification.postId}` : "#"
        }
      case "report_reviewed":
        return {
          icon: "👮",
          text: `Your report has been reviewed by admin${notification.action ? `: ${notification.action}` : ""}`,
          photo: null,
          link: notification.postId ? `/user/my-posts?postId=${notification.postId}` : "#"
        }
      case "post_violation":
        return {
          icon: "🚫",
          text: `Your post was removed due to violation: ${notification.violationReason || "Community guidelines"}`,
          photo: null,
          link: notification.postId ? `/user/my-posts?postId=${notification.postId}` : "#"
        }
      case "comment_reviewed":
        return {
          icon: "📝",
          text: `Admin has reviewed your comment${notification.action ? `: ${notification.action}` : ""}`,
          photo: null,
          link: notification.postId ? `/user/my-posts?postId=${notification.postId}` : "#"
        }
      case "reply_reviewed":
        return {
          icon: "↩️",
          text: `Admin has reviewed your reply${notification.action ? `: ${notification.action}` : ""}`,
          photo: null,
          link: notification.postId ? `/user/my-posts?postId=${notification.postId}` : "#"
        }
      case "report_action":
        return {
          icon: "✅",
          text: `Your reported post has been ${notification.action || "reviewed"} by admin`,
          photo: null,
          link: notification.postId ? `/user/my-posts?postId=${notification.postId}` : "#"
        }
      case "content_warning":
        return {
          icon: "⚠️",
          text: `Your post contains content that violates our guidelines: ${notification.reason || "Community guidelines"}`,
          photo: null,
          link: notification.postId ? `/user/my-posts?postId=${notification.postId}` : "#"
        }
      case "admin_response":
        return {
          icon: "💬",
          text: `Admin has responded to your feedback: ${notification.response || "View response"}`,
          photo: null,
          link: notification.postId ? `/user/my-posts?postId=${notification.postId}` : "#"
        }
      case "admin_feedback":
        return {
          icon: "📝",
          text: `Admin has provided feedback on your post: ${notification.feedback || "View feedback"}`,
          photo: null,
          link: notification.postId ? `/user/my-posts?postId=${notification.postId}` : "#"
        }
      case "admin_reply":
        return {
          icon: "↩️",
          text: `Admin has replied to your comment: ${notification.reply || "View reply"}`,
          photo: null,
          link: notification.postId ? `/user/my-posts?postId=${notification.postId}` : "#"
        }
      case "admin_edit":
        return {
          icon: "✏️",
          text: `Admin has edited their response to your post`,
          photo: null,
          link: notification.postId ? `/user/my-posts?postId=${notification.postId}` : "#"
        }
      default:
        return {
          icon: "📢",
          text: notification.message || "New notification",
          photo: null,
          link: "#"
        }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => {
              const content = getNotificationContent(notification)
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="p-2 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={content.photo || "/placeholder.svg"} />
                      <AvatarFallback>{content.icon}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-none">
                        {content.text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        )}
        <DropdownMenuItem asChild>
          <Link href="/user/notifications">
            <div className="flex items-center justify-center w-full py-1 text-primary">
              View All Notifications
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
