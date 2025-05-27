"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, UserPlus, Users, UserCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
} from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { createFriendAcceptedNotification } from "@/lib/notification-service"
import Link from "next/link"

export default function FriendsPage() {
  const [friendRequests, setFriendRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [friends, setFriends] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const { user, userData } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check on mount
    handleResize()

    // Listen for window resize events
    window.addEventListener("resize", handleResize)

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    // Set up real-time listener for incoming friend requests
    const incomingRequestsRef = collection(db, "friendRequests")
    const incomingQuery = query(
      incomingRequestsRef,
      where("receiverId", "==", user.uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
    )

    const unsubscribeIncoming = onSnapshot(
      incomingQuery,
      async (snapshot) => {
        try {
          const requests = []
          for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data()

            // Get sender profile data if needed
            let senderAvatar = data.senderAvatar
            if (!senderAvatar) {
              try {
                const senderDoc = await getDoc(doc(db, "users", data.senderId))
                if (senderDoc.exists()) {
                  const senderData = senderDoc.data()
                  senderAvatar = senderData.profileImage || senderData.photoURL
                }
              } catch (err) {
                console.error("Error fetching sender data:", err)
              }
            }

            requests.push({
              id: docSnapshot.id,
              ...data,
              senderAvatar: senderAvatar || "/anonymous-user.jpeg",
              createdAt: data.createdAt?.toDate() || new Date(),
            })
          }
          setFriendRequests(requests)
          setIsLoading(false)
        } catch (error) {
          console.error("Error processing friend requests:", error)
          setIsLoading(false)
        }
      },
      (error) => {
        console.error("Error fetching friend requests:", error)
        setIsLoading(false)
      },
    )

    // Set up real-time listener for sent friend requests
    const sentRequestsRef = collection(db, "friendRequests")
    const sentQuery = query(sentRequestsRef, where("senderId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribeSent = onSnapshot(
      sentQuery,
      async (snapshot) => {
        try {
          const requests = []
          for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data()

            // Get receiver profile data if needed
            let receiverAvatar = data.receiverAvatar
            if (!receiverAvatar) {
              try {
                const receiverDoc = await getDoc(doc(db, "users", data.receiverId))
                if (receiverDoc.exists()) {
                  const receiverData = receiverDoc.data()
                  receiverAvatar = receiverData.profileImage || receiverData.photoURL
                }
              } catch (err) {
                console.error("Error fetching receiver data:", err)
              }
            }

            requests.push({
              id: docSnapshot.id,
              ...data,
              receiverAvatar: receiverAvatar || "/anonymous-user.jpeg",
              createdAt: data.createdAt?.toDate() || new Date(),
            })
          }
          setSentRequests(requests)
        } catch (error) {
          console.error("Error processing sent requests:", error)
        }
      },
      (error) => {
        console.error("Error fetching sent requests:", error)
      },
    )

    // Set up real-time listener for friends
    const friendshipsRef = collection(db, "friendships")
    const friendshipsQuery = query(friendshipsRef, where("users", "array-contains", user.uid))

    const unsubscribeFriendships = onSnapshot(
      friendshipsQuery,
      (snapshot) => {
        const friendships = snapshot.docs.map((doc) => {
          const data = doc.data()
          const otherUserId = data.users.find((id) => id !== user.uid)
          const otherUserDetails = data.userDetails[otherUserId]

          return {
            id: doc.id,
            userId: otherUserId,
            name: otherUserDetails?.name || "Unknown User",
            avatar: otherUserDetails?.avatar || "/anonymous-user.jpeg",
            createdAt: data.createdAt?.toDate() || new Date(),
          }
        })
        setFriends(friendships)
      },
      (error) => {
        console.error("Error fetching friendships:", error)
      },
    )

    return () => {
      unsubscribeIncoming()
      unsubscribeSent()
      unsubscribeFriendships()
    }
  }, [user])

  const handleAcceptRequest = async (request) => {
    if (processingRequest) return
    setProcessingRequest(request.id)

    try {
      // Update the friend request status
      const requestRef = doc(db, "friendRequests", request.id)
      await updateDoc(requestRef, {
        status: "accepted",
        updatedAt: new Date(),
      })

      // Create a friendship document
      const friendshipData = {
        users: [user.uid, request.senderId],
        userDetails: {
          [user.uid]: {
            name:
              userData?.firstName && userData?.lastName
                ? `${userData.firstName} ${userData.lastName}`
                : user.displayName || user.email,
            avatar: userData?.profileImage || userData?.photoURL || user?.photoURL || "/anonymous-user.jpeg",
          },
          [request.senderId]: {
            name: request.senderName,
            avatar: request.senderAvatar || "/anonymous-user.jpeg",
          },
        },
        createdAt: new Date(),
        lastInteractionAt: new Date(),
      }

      await addDoc(collection(db, "friendships"), friendshipData)

      // Create notification for the sender
      try {
        await createFriendAcceptedNotification(
          request.senderId,
          user.uid,
          userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : user.displayName || user.email,
          userData?.profileImage || userData?.photoURL || user?.photoURL || "/anonymous-user.jpeg",
        )
      } catch (notifError) {
        console.error("Error creating friend accepted notification:", notifError)
      }

      toast({
        title: "Friend request accepted",
        description: `You are now friends with ${request.senderName}`,
      })
    } catch (error) {
      console.error("Error accepting friend request:", error)
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleDeclineRequest = async (request) => {
    if (processingRequest) return
    setProcessingRequest(request.id)

    try {
      // Delete the friend request
      const requestRef = doc(db, "friendRequests", request.id)
      await deleteDoc(requestRef)

      toast({
        title: "Friend request declined",
        description: `Friend request from ${request.senderName} was declined`,
      })
    } catch (error) {
      console.error("Error declining friend request:", error)
      toast({
        title: "Error",
        description: "Failed to decline friend request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleCancelRequest = async (request) => {
    if (processingRequest) return
    setProcessingRequest(request.id)

    try {
      // Delete the friend request
      const requestRef = doc(db, "friendRequests", request.id)
      await deleteDoc(requestRef)

      toast({
        title: "Request canceled",
        description: `Friend request to ${request.receiverName || "user"} was canceled`,
      })
    } catch (error) {
      console.error("Error canceling friend request:", error)
      toast({
        title: "Error",
        description: "Failed to cancel friend request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingRequest(null)
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
    <PageLayout>
      <div className={`space-y-6 ${isMobile ? "mt-6" : ""}`}>
        <PageBanner
          title="Friends & Connections"
          description="Manage your friend requests and connections with other members of the community."
          size="lg"
        >
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Find Friends
            </Button>
          </div>
        </PageBanner>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="requests" className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Requests
              {friendRequests.length > 0 && (
                <span className="ml-2 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                  {friendRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center">
              <UserCheck className="h-4 w-4 mr-2" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Friends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            {isLoading ? (
              <div className="text-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading friend requests...</p>
              </div>
            ) : friendRequests.length > 0 ? (
              <div className="grid gap-4">
                {friendRequests.map((request) => (
                  <div key={request.id} className="bg-card rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                      <Avatar className="h-12 w-12 border-2 border-primary/10">
                        <AvatarImage
                          src={request.senderAvatar || "/anonymous-user.jpeg"}
                          alt={request.senderName}
                          onError={(e) => {
                            e.target.src = "/anonymous-user.jpeg"
                          }}
                        />
                        <AvatarFallback>{getUserInitials(request.senderName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/user/profile/${request.senderId}`}
                          className="font-medium hover:underline truncate block"
                        >
                          {request.senderName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Sent you a friend request{" "}
                          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => handleAcceptRequest(request)}
                          disabled={processingRequest === request.id}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => handleDeclineRequest(request)}
                          disabled={processingRequest === request.id}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-muted/30 rounded-lg">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No pending friend requests</h3>
                <p className="text-muted-foreground">When someone sends you a friend request, it will appear here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length > 0 ? (
              <div className="grid gap-4">
                {sentRequests.map((request) => (
                  <div key={request.id} className="bg-card rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                      <Avatar className="h-12 w-12 border-2 border-primary/10">
                        <AvatarImage
                          src={request.receiverAvatar || "/anonymous-user.jpeg"}
                          alt={request.receiverName || "User"}
                          onError={(e) => {
                            e.target.src = "/anonymous-user.jpeg"
                          }}
                        />
                        <AvatarFallback>{getUserInitials(request.receiverName || "User")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/user/profile/${request.receiverId}`}
                          className="font-medium hover:underline truncate block"
                        >
                          {request.receiverName || "User"}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Status: <span className="font-medium capitalize">{request.status}</span> • Sent{" "}
                          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {request.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto mt-2 sm:mt-0"
                          onClick={() => handleCancelRequest(request)}
                          disabled={processingRequest === request.id}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-muted/30 rounded-lg">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No sent friend requests</h3>
                <p className="text-muted-foreground">Friend requests you've sent will appear here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="friends" className="space-y-4">
            {friends.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="bg-card rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/10">
                        <AvatarImage
                          src={friend.avatar || "/anonymous-user.jpeg"}
                          alt={friend.name}
                          onError={(e) => {
                            e.target.src = "/anonymous-user.jpeg"
                          }}
                        />
                        <AvatarFallback>{getUserInitials(friend.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/user/profile/${friend.userId}`}
                          className="font-medium hover:underline truncate block"
                        >
                          {friend.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Friends since {formatDistanceToNow(new Date(friend.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-primary/10"
                        asChild
                      >
                        <Link href={`/user/messages?to=${friend.userId}`}>Message</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-muted/30 rounded-lg">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No friends yet</h3>
                <p className="text-muted-foreground">When you connect with other users, they'll appear here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
