"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserPlus, Check, X, Users } from "lucide-react"
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
  limit,
} from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { createFriendAcceptedNotification } from "@/lib/notification-service"
import Link from "next/link"

export function FriendRequestDropdown() {
  const [friendRequests, setFriendRequests] = useState([])
  const [acceptedRequests, setAcceptedRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState(null)
  const { user, userData } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    // Set up real-time listener for pending friend requests
    const requestsRef = collection(db, "friendRequests")
    const pendingQuery = query(
      requestsRef,
      where("receiverId", "==", user.uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
    )

    const unsubscribePending = onSnapshot(
      pendingQuery,
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

    // Set up real-time listener for accepted friend requests (for sender)
    const acceptedQuery = query(
      requestsRef,
      where("senderId", "==", user.uid),
      where("status", "==", "accepted"),
      orderBy("updatedAt", "desc"),
      limit(5)
    )

    const unsubscribeAccepted = onSnapshot(
      acceptedQuery,
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
            })
          }
          setAcceptedRequests(requests)
        } catch (error) {
          console.error("Error processing accepted requests:", error)
        }
      },
      (error) => {
        console.error("Error fetching accepted requests:", error)
      },
    )

    return () => {
      unsubscribePending()
      unsubscribeAccepted()
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
        >
          <Users className="h-5 w-5" />
          {friendRequests.length > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
              {friendRequests.length > 9 ? "9+" : friendRequests.length}
            </span>
          )}
          <span className="sr-only">Friend Requests</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Friend Requests</span>
          {friendRequests.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {friendRequests.length}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading requests...</div>
        ) : (
          <>
            {/* Pending Requests */}
            {friendRequests.length > 0 && (
              <>
                {friendRequests.map((request) => (
                  <div key={request.id} className="p-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10 border-2 border-primary/10">
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
                          className="font-medium text-sm hover:underline truncate block"
                        >
                          {request.senderName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(request.createdAt.toDate()), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-full bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                          onClick={() => handleAcceptRequest(request)}
                          disabled={processingRequest === request.id}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Accept</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                          onClick={() => handleDeclineRequest(request)}
                          disabled={processingRequest === request.id}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Decline</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <DropdownMenuSeparator />
              </>
            )}

            {/* Accepted Requests (for sender) */}
            {acceptedRequests.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                  Recently Accepted
                </div>
                {acceptedRequests.map((request) => (
                  <div key={request.id} className="p-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10 border-2 border-primary/10">
                        <AvatarImage
                          src={request.receiverAvatar || "/anonymous-user.jpeg"}
                          alt={request.receiverName}
                          onError={(e) => {
                            e.target.src = "/anonymous-user.jpeg"
                          }}
                        />
                        <AvatarFallback>{getUserInitials(request.receiverName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/user/profile/${request.receiverId}`}
                          className="font-medium text-sm hover:underline truncate block"
                        >
                          {request.receiverName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Accepted {formatDistanceToNow(new Date(request.updatedAt.toDate()), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <DropdownMenuSeparator />
              </>
            )}

            {/* No Requests Message */}
            {friendRequests.length === 0 && acceptedRequests.length === 0 && (
              <div className="p-4 text-center">
                <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending friend requests</p>
              </div>
            )}

            <DropdownMenuItem asChild>
              <Link href="/user/friends" className="w-full cursor-pointer">
                <UserPlus className="h-4 w-4 mr-2" />
                View all friend requests
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
