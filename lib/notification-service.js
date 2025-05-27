import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore"

// Create a notification
export async function createNotification(data) {
  try {
    const notificationData = {
      ...data,
      read: false,
      timestamp: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    return { id: docRef.id, ...notificationData }
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Create a reaction notification (handles grouping multiple reactions)
export async function createReactionNotification(userId, postId, reactorId, reactorName, reactorAvatar, reactionType) {
  try {
    // Check if there's an existing unread reaction notification for this post
    const notificationsRef = collection(db, "notifications")
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("postId", "==", postId),
      where("type", "==", "reaction"),
    )

    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      // Update existing notification
      const notificationDoc = snapshot.docs[0]
      const notificationData = notificationDoc.data()

      // Check if this user already reacted
      const existingUserIndex = notificationData.otherUsers?.findIndex((u) => u.id === reactorId)

      if (existingUserIndex >= 0) {
        // User already in the list, update their reaction type
        if (notificationData.otherUsers) {
          notificationData.otherUsers[existingUserIndex].reactionType = reactionType
        }
      } else if (notificationData.user.id === reactorId) {
        // This is the main user, update their reaction type
        notificationData.reactionType = reactionType
      } else {
        // Add to otherUsers
        const otherUsers = notificationData.otherUsers || []
        otherUsers.push({
          id: reactorId,
          name: reactorName,
          avatar: reactorAvatar,
          reactionType: reactionType,
        })

        await updateDoc(doc(db, "notifications", notificationDoc.id), {
          otherUsers: otherUsers,
          timestamp: serverTimestamp(),
        })
      }

      return notificationDoc.id
    } else {
      // Create new notification
      const notificationData = {
        type: "reaction",
        userId: userId,
        postId: postId,
        read: false,
        timestamp: serverTimestamp(),
        user: {
          id: reactorId,
          name: reactorName,
          avatar: reactorAvatar,
        },
        reactionType: reactionType,
        otherUsers: [],
      }

      const docRef = await addDoc(collection(db, "notifications"), notificationData)
      return docRef.id
    }
  } catch (error) {
    console.error("Error creating reaction notification:", error)
    throw error
  }
}

// Create a comment notification (handles grouping multiple comments)
export async function createCommentNotification(
  userId,
  postId,
  commenterId,
  commenterName,
  commenterAvatar,
  commentContent,
) {
  try {
    // Check if there's an existing unread comment notification for this post
    const notificationsRef = collection(db, "notifications")
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("postId", "==", postId),
      where("type", "==", "comment"),
    )

    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      // Update existing notification
      const notificationDoc = snapshot.docs[0]
      const notificationData = notificationDoc.data()

      // Check if this user already commented
      const existingUserIndex = notificationData.otherUsers?.findIndex((u) => u.id === commenterId)

      if (existingUserIndex >= 0) {
        // User already in the list, update their comment
        if (notificationData.otherUsers) {
          notificationData.otherUsers[existingUserIndex].content = commentContent
        }
      } else if (notificationData.user.id === commenterId) {
        // This is the main user, update their comment
        notificationData.content = commentContent
      } else {
        // Add to otherUsers
        const otherUsers = notificationData.otherUsers || []
        otherUsers.push({
          id: commenterId,
          name: commenterName,
          avatar: commenterAvatar,
          content: commentContent,
        })

        await updateDoc(doc(db, "notifications", notificationDoc.id), {
          otherUsers: otherUsers,
          timestamp: serverTimestamp(),
        })
      }

      return notificationDoc.id
    } else {
      // Create new notification
      const notificationData = {
        type: "comment",
        userId: userId,
        postId: postId,
        read: false,
        timestamp: serverTimestamp(),
        user: {
          id: commenterId,
          name: commenterName,
          avatar: commenterAvatar,
        },
        content: commentContent,
        otherUsers: [],
      }

      const docRef = await addDoc(collection(db, "notifications"), notificationData)
      return docRef.id
    }
  } catch (error) {
    console.error("Error creating comment notification:", error)
    throw error
  }
}

// Create a share notification
export async function createShareNotification(userId, postId, sharerId, sharerName, sharerAvatar) {
  try {
    const notificationData = {
      type: "share",
      userId: userId,
      postId: postId,
      read: false,
      timestamp: serverTimestamp(),
      user: {
        id: sharerId,
        name: sharerName,
        avatar: sharerAvatar,
      },
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    return docRef.id
  } catch (error) {
    console.error("Error creating share notification:", error)
    throw error
  }
}

// Create a friend request notification
export async function createFriendRequestNotification(receiverId, senderId, senderName, senderAvatar, requestId) {
  try {
    const notificationData = {
      type: "friendRequest",
      userId: receiverId,
      read: false,
      timestamp: serverTimestamp(),
      user: {
        id: senderId,
        name: senderName,
        avatar: senderAvatar,
      },
      requestId: requestId,
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    return docRef.id
  } catch (error) {
    console.error("Error creating friend request notification:", error)
    throw error
  }
}

// Create a friend accepted notification
export async function createFriendAcceptedNotification(receiverId, accepterId, accepterName, accepterAvatar) {
  try {
    const notificationData = {
      type: "friendAccepted",
      userId: receiverId,
      read: false,
      timestamp: serverTimestamp(),
      user: {
        id: accepterId,
        name: accepterName,
        avatar: accepterAvatar,
      },
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    return docRef.id
  } catch (error) {
    console.error("Error creating friend accepted notification:", error)
    throw error
  }
}

// Create a post approved notification
export async function createPostApprovedNotification(userId, postId) {
  try {
    const notificationData = {
      type: "approved",
      userId: userId,
      postId: postId,
      read: false,
      timestamp: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    return docRef.id
  } catch (error) {
    console.error("Error creating post approved notification:", error)
    throw error
  }
}

// Create a post declined notification
export async function createPostDeclinedNotification(userId, postId, reason) {
  try {
    const notificationData = {
      type: "declined",
      userId: userId,
      postId: postId,
      content: reason,
      read: false,
      timestamp: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    return docRef.id
  } catch (error) {
    console.error("Error creating post declined notification:", error)
    throw error
  }
}
