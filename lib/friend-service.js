import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore"
import { createFriendRequestNotification, createFriendAcceptedNotification } from "./notification-service"

// Send a friend request
export async function sendFriendRequest(senderId, senderName, senderAvatar, receiverId) {
  try {
    // Check if a request already exists
    const requestsRef = collection(db, "friendRequests")
    const q = query(requestsRef, where("senderId", "==", senderId), where("receiverId", "==", receiverId))

    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      // Request already exists
      return { exists: true, id: snapshot.docs[0].id }
    }

    // Create a new friend request
    const requestData = {
      senderId,
      senderName,
      senderAvatar,
      receiverId,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "friendRequests"), requestData)

    // Create notification for the receiver
    try {
      await createFriendRequestNotification(receiverId, senderId, senderName, senderAvatar, docRef.id)
    } catch (notifError) {
      console.error("Error creating friend request notification:", notifError)
    }

    return { id: docRef.id, ...requestData }
  } catch (error) {
    console.error("Error sending friend request:", error)
    throw error
  }
}

// Cancel a friend request
export async function cancelFriendRequest(requestId) {
  try {
    const requestRef = doc(db, "friendRequests", requestId)
    await deleteDoc(requestRef)
    return true
  } catch (error) {
    console.error("Error canceling friend request:", error)
    throw error
  }
}

// Accept a friend request
export async function acceptFriendRequest(requestId, accepterId, accepterName, accepterAvatar) {
  try {
    // Get the request data
    const requestRef = doc(db, "friendRequests", requestId)
    const requestSnap = await getDoc(requestRef)

    if (!requestSnap.exists()) {
      throw new Error("Friend request not found")
    }

    const requestData = requestSnap.data()

    // Update the request status
    await updateDoc(requestRef, {
      status: "accepted",
      updatedAt: serverTimestamp(),
    })

    // Create a friendship document
    const friendshipData = {
      users: [accepterId, requestData.senderId],
      userDetails: {
        [accepterId]: {
          name: accepterName,
          avatar: accepterAvatar,
        },
        [requestData.senderId]: {
          name: requestData.senderName,
          avatar: requestData.senderAvatar,
        },
      },
      createdAt: serverTimestamp(),
      lastInteractionAt: serverTimestamp(),
    }

    const friendshipRef = await addDoc(collection(db, "friendships"), friendshipData)

    // Create notification for the sender
    try {
      await createFriendAcceptedNotification(requestData.senderId, accepterId, accepterName, accepterAvatar)
    } catch (notifError) {
      console.error("Error creating friend accepted notification:", notifError)
    }

    return { id: friendshipRef.id, ...friendshipData }
  } catch (error) {
    console.error("Error accepting friend request:", error)
    throw error
  }
}

// Check friendship status between two users
export async function checkFriendshipStatus(userId1, userId2) {
  try {
    // Check for pending requests in either direction
    const requestsRef = collection(db, "friendRequests")

    // Check if user1 sent a request to user2
    const sentQuery = query(requestsRef, where("senderId", "==", userId1), where("receiverId", "==", userId2))

    const sentSnapshot = await getDocs(sentQuery)

    if (!sentSnapshot.empty) {
      const requestData = sentSnapshot.docs[0].data()
      return {
        status: requestData.status,
        requestId: sentSnapshot.docs[0].id,
        direction: "sent",
      }
    }

    // Check if user2 sent a request to user1
    const receivedQuery = query(requestsRef, where("senderId", "==", userId2), where("receiverId", "==", userId1))

    const receivedSnapshot = await getDocs(receivedQuery)

    if (!receivedSnapshot.empty) {
      const requestData = receivedSnapshot.docs[0].data()
      return {
        status: requestData.status,
        requestId: receivedSnapshot.docs[0].id,
        direction: "received",
      }
    }

    // Check if they are already friends
    const friendshipsRef = collection(db, "friendships")
    const friendshipQuery = query(friendshipsRef, where("users", "array-contains", userId1))

    const friendshipSnapshot = await getDocs(friendshipQuery)

    if (!friendshipSnapshot.empty) {
      // Check if any of these friendships include user2
      const friendship = friendshipSnapshot.docs.find((doc) => {
        const data = doc.data()
        return data.users.includes(userId2)
      })

      if (friendship) {
        return {
          status: "friends",
          friendshipId: friendship.id,
        }
      }
    }

    // No relationship found
    return { status: "none" }
  } catch (error) {
    console.error("Error checking friendship status:", error)
    throw error
  }
}
