"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { NotificationItem } from "@/components/notifications/notification-item"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch } from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    // Set up real-time listener for notifications
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "==", user.uid), orderBy("timestamp", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        }))
        setNotifications(notificationData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        toast({
          title: "Error",
          description: "Failed to load notifications. Please refresh the page.",
          variant: "destructive",
        })
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user, toast])

  const unreadNotifications = notifications.filter((notification) => !notification.read)
  const readNotifications = notifications.filter((notification) => notification.read)

  const markAllAsRead = async () => {
    if (unreadNotifications.length === 0) return

    try {
      const batch = writeBatch(db)

      unreadNotifications.forEach((notification) => {
        const notifRef = doc(db, "notifications", notification.id)
        batch.update(notifRef, { read: true })
      })

      await batch.commit()

      toast({
        title: "Notifications updated",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notifications as read. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleNotificationAction = async (action) => {
    // Handle different notification actions
    console.log("Notification action:", action)

    // Update local state if needed
    if (action.type === "markAsRead") {
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === action.notificationId ? { ...notif, read: true } : notif)),
      )
    }
  }

  return (
    <PageLayout>
      <PageBanner
        title="Notifications"
        description="Stay updated with interactions on your posts and community activity."
      >
        {!loading && unreadNotifications.length > 0 && (
          <Button className="mt-4 bg-white text-primary hover:bg-white/90" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </PageBanner>

      <div className="max-w-2xl mx-auto">
        <Card className="animate-in">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Activity Updates</CardTitle>
              {!loading && unreadNotifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">
                  Unread
                  {!loading && unreadNotifications.length > 0 && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      {unreadNotifications.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {loading ? (
                  <>
                    <NotificationSkeleton />
                    <NotificationSkeleton />
                    <NotificationSkeleton />
                  </>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onAction={handleNotificationAction}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">You don't have any notifications</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="unread" className="mt-4">
                {loading ? (
                  <NotificationSkeleton />
                ) : unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onAction={handleNotificationAction}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">You don't have any unread notifications</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

function NotificationSkeleton() {
  return (
    <Card className="p-4 mb-2 border-l-4 border-l-transparent">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </Card>
  )
}
