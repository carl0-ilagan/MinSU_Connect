"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Send, Search, Info, MessageSquare, User, Calendar, MapPin, UserPlus, Plus } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  increment, 
  getDocs 
} from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

// Mock data for conversations
const mockConversations = [
  {
    id: 1,
    user: {
      id: 2,
      name: "John Doe",
      avatar: "/thoughtful-man.png",
      online: true,
      lastSeen: null,
      bio: "Computer Science student at MINSU. Passionate about web development and AI.",
      department: "Computer Science",
      year: "3rd Year",
      location: "Calapan City",
    },
    lastMessage: {
      content: "Hey, how's your project coming along?",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      read: true,
    },
    unread: 0,
  },
  {
    id: 2,
    user: {
      id: 3,
      name: "Sarah Johnson",
      avatar: "/woman-with-glasses.png",
      online: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      bio: "Biology major with a focus on marine ecosystems. Research assistant at the Marine Lab.",
      department: "Biology",
      year: "4th Year",
      location: "Puerto Galera",
    },
    lastMessage: {
      content: "Thanks for sharing that research paper!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      read: true,
    },
    unread: 0,
  },
  {
    id: 3,
    user: {
      id: 4,
      name: "Michael Brown",
      avatar: "/bearded-man-portrait.png",
      online: true,
      lastSeen: null,
      bio: "Engineering student specializing in renewable energy. Working on solar panel efficiency.",
      department: "Engineering",
      year: "2nd Year",
      location: "Calapan City",
    },
    lastMessage: {
      content: "Are you coming to the meetup tomorrow?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      read: false,
    },
    unread: 2,
  },
  {
    id: 4,
    user: {
      id: 5,
      name: "Emily Wilson",
      avatar: "/red-haired-woman.png",
      online: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      bio: "Education major focusing on early childhood development. Student teacher at MINSU Elementary.",
      department: "Education",
      year: "4th Year",
      location: "Victoria",
    },
    lastMessage: {
      content: "I've shared the presentation slides with you.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      read: true,
    },
    unread: 0,
  },
  {
    id: 5,
    user: {
      id: 6,
      name: "David Lee",
      avatar: "/thoughtful-asian-man.png",
      online: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      bio: "Business Administration student with a minor in Marketing. Intern at local startup.",
      department: "Business Administration",
      year: "3rd Year",
      location: "Naujan",
    },
    lastMessage: {
      content: "Let me know when you're free to discuss the project.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      read: true,
    },
    unread: 0,
  },
]

// Mock data for messages in a conversation
const mockMessages = [
  {
    id: 1,
    senderId: 1, // Current user
    content: "Hi there! How are you doing?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 2,
    senderId: 2, // Other user
    content: "Hey! I'm good, thanks for asking. How about you?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), // 23 hours ago
  },
  {
    id: 3,
    senderId: 1,
    content: "I'm doing well! Just working on some projects for the university.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), // 22 hours ago
  },
  {
    id: 4,
    senderId: 2,
    content: "That sounds interesting! What kind of projects are you working on?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 21).toISOString(), // 21 hours ago
  },
  {
    id: 5,
    senderId: 1,
    content:
      "I'm working on a research paper about sustainable development and also preparing for the upcoming science fair.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), // 20 hours ago
  },
  {
    id: 6,
    senderId: 2,
    content:
      "That's awesome! I'm actually interested in sustainable development too. Maybe we could collaborate sometime?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 7,
    senderId: 1,
    content: "That would be great! I'd love to hear your ideas.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
  },
  {
    id: 8,
    senderId: 2,
    content: "Perfect! I'll send you some of my research materials later today.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: 9,
    senderId: 1,
    content: "Looking forward to it! Thanks.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 10,
    senderId: 2,
    content: "Hey, how's your project coming along?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
  },
]

function formatMessageTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    // Today, show time
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } else if (diffInDays === 1) {
    // Yesterday
    return "Yesterday"
  } else if (diffInDays < 7) {
    // Within a week, show day name
    return date.toLocaleDateString([], { weekday: "short" })
  } else {
    // More than a week, show date
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }
}

function formatLastSeen(timestamp) {
  if (!timestamp) return ""

  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffInMinutes < 60) {
    return `Last seen ${diffInMinutes} min ago`
  } else if (diffInMinutes < 60 * 24) {
    const hours = Math.floor(diffInMinutes / 60)
    return `Last seen ${hours} ${hours === 1 ? "hour" : "hours"} ago`
  } else {
    return `Last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`
  }
}

// User Profile Component
function UserProfile({ user }) {
  if (!user) return null

  return (
    <div className="flex flex-col items-center">
      <Avatar className="h-24 w-24 mb-4 border-4 border-primary/10">
        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
        <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
      </Avatar>

      <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
      <div className="flex items-center mb-4">
        <Badge variant="outline" className="bg-primary/10 text-primary">
          {user.department}
        </Badge>
        <span className="mx-2 text-muted-foreground">•</span>
        <span className="text-sm text-muted-foreground">{user.year}</span>
      </div>

      <p className="text-center text-muted-foreground mb-4">{user.bio}</p>

      <div className="w-full space-y-3">
        <div className="flex items-center text-sm">
          <User className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>Student at Mindoro State University</span>
        </div>
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>Joined 2023</span>
        </div>
        <div className="flex items-center text-sm">
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{user.location}</span>
        </div>
      </div>

      <div className="mt-6 w-full">
        <Button className="w-full" asChild>
          <Link href={`/user/profile/${user.id}`}>View Full Profile</Link>
        </Button>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [showConversation, setShowConversation] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [friends, setFriends] = useState([])
  const { user, userData } = useAuth()
  const { toast } = useToast()

  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("user")

  // Fetch user's friends - Keep this to have friend data readily available
  useEffect(() => {
    if (!user?.uid) return

    const fetchFriends = async () => {
      try {
        const friendshipsRef = collection(db, "friendships")
        const friendshipsQuery = query(friendshipsRef, where("users", "array-contains", user.uid))
        
        const unsubscribe = onSnapshot(friendshipsQuery, async (snapshot) => {
          const friendsList = []
          
          for (const friendshipDoc of snapshot.docs) {
            const friendshipData = friendshipDoc.data()
            const otherUserId = friendshipData.users.find(id => id !== user.uid)
            
            if (otherUserId) {
              try {
                const userRef = doc(db, "users", otherUserId)
                const userDoc = await getDoc(userRef)
                
                if (userDoc.exists()) {
                  const userData = userDoc.data()
                  friendsList.push({
                    id: otherUserId,
                    name: userData.displayName || `${userData.firstName} ${userData.lastName}`,
                    avatar: userData.photoURL || userData.profileImage,
                    online: userData.isOnline || false,
                    lastSeen: userData.lastActive,
                    bio: userData.bio,
                    department: userData.department,
                    year: userData.year,
                    location: userData.location,
                    campus: userData.campus || "MINSU"
                  })
                } else {
                  console.warn("User document not found for ID:", otherUserId)
                }
              } catch (error) {
                console.error("Error fetching user data for friends:", error)
              }
            }
          }
          
          setFriends(friendsList)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching friends:", error)
        toast({
          title: "Error",
          description: "Failed to load friends. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchFriends()
  }, [user?.uid, toast])

  // Fetch user's conversations in real-time
  useEffect(() => {
    if (!user?.uid) return

    setLoading(true)

    const conversationsRef = collection(db, "conversations")
    const conversationsQuery = query(
      conversationsRef,
      where("participants", "array-contains", user.uid),
      orderBy(
        activeConversation?.lastMessageAt ? "lastMessageAt" : "createdAt",
        "desc"
      )
    )

    console.log("Setting up conversations listener for user:", user.uid)

    const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
      console.log("Conversations snapshot received. Number of changes:", snapshot.docChanges().length)
      const conversationsList = []

      for (const conversationDoc of snapshot.docs) {
        const conversationData = conversationDoc.data()
        const otherUserId = conversationData.participants.find(id => id !== user.uid)

        if (otherUserId) {
          const friendUser = friends.find(f => f.id === otherUserId)

          if (friendUser) {
            conversationsList.push({
              id: conversationDoc.id,
              ...conversationData,
              user: friendUser,
              lastMessage: {
                content: conversationData.lastMessage?.content || "No messages yet",
                timestamp: conversationData.lastMessage?.timestamp?.toDate() || conversationData.lastMessageAt?.toDate() || new Date(),
                read: conversationData.lastMessage?.read || false,
              },
              unread: conversationData.unreadCount?.[user.uid] || 0,
            })
          } else {
            console.warn("Friend data not found for conversation participant:", otherUserId)
          }
        }
      }

      conversationsList.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp?.getTime() || 0
        const timeB = b.lastMessage?.timestamp?.getTime() || 0
        return timeB - timeA
      })

      setConversations(conversationsList)
      setLoading(false)
      console.log("Conversations list updated:", conversationsList.length)

      if (userId && conversationsList.length > 0 && (!activeConversation || activeConversation.user.id !== userId)) {
        const conversationToActivate = conversationsList.find(conv => conv.user.id === userId)
        if (conversationToActivate) {
          console.log("Activating conversation from URL param:", conversationToActivate.id)
          handleSelectConversation(conversationToActivate)
        } else {
          console.warn("Conversation with user ID from URL not found in loaded conversations:", userId)
        }
      }
    }, (error) => {
      console.error("Error fetching conversations:", error)
      setLoading(false)
      toast({
        title: "Error",
        description: "Failed to load conversations. Please try again.",
        variant: "destructive",
      })
    })

    return () => {
      console.log("Unsubscribing from conversations listener")
      unsubscribe()
    }
  }, [user?.uid, friends, userId, toast])

  // Add message read status update
  useEffect(() => {
    if (!user?.uid || !activeConversation || messages.length === 0) return

    const unreadMessages = messages.filter(
      message => !message.read && message.senderId !== user.uid
    )

    if (unreadMessages.length > 0) {
      const updatePromises = unreadMessages.map(message => {
        const messageRef = doc(db, "messages", message.id)
        return updateDoc(messageRef, { read: true })
      })

      const conversationRef = doc(db, "conversations", activeConversation.id)
      updatePromises.push(
        updateDoc(conversationRef, {
          [`unreadCount.${user.uid}`]: 0
        })
      )

      Promise.all(updatePromises).catch(error => {
        console.error("Error updating message read status:", error)
      })
      }
  }, [activeConversation, messages, user?.uid])

  // Loading state check moved after all hooks
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Handle selecting a conversation (now also triggered by URL param after conversations load)
  const handleSelectConversation = async (conversation) => {
    if (!user?.uid || !conversation) return; // Ensure user and conversation are loaded

    setActiveConversation(conversation)
    setShowConversation(true)

    // Clear previous messages when selecting a new conversation
    setMessages([])

    try {
      // Fetch messages for this conversation
      const messagesRef = collection(db, "messages")
      const messagesQuery = query(
        messagesRef,
        where("conversationId", "==", conversation.id),
        orderBy("timestamp", "asc")
      )

      console.log("Setting up message listener for conversation:", conversation.id)

      const unsubscribe = onSnapshot(messagesQuery, 
        (snapshot) => {
          console.log("Messages snapshot received. Number of changes:", snapshot.docChanges().length)
          const messagesList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure timestamp is a Date object
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          }))
          console.log("Processed messages:", messagesList)
          setMessages(messagesList)

          // Scroll to the latest message when messages update (optional, but good UX)
          // This would typically require useRef to target the message area div
          // Example: messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
        },
        (error) => {
          console.error("Error fetching messages:", error)
          if (error.code === 'failed-precondition') {
            console.log("Please ensure the required index is created:", error.message)
          }
          toast({
            title: "Error",
            description: "Failed to load messages. Please try again.",
            variant: "destructive",
          })
        }
      )

      // Return the unsubscribe function to clean up the listener
      return () => {
        console.log("Unsubscribing from message listener for conversation:", conversation.id)
        unsubscribe()
      }

    } catch (error) {
      console.error("Error setting up messages listener:", error)
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      })
      // Ensure we return a no-op unsubscribe function even if initial setup fails
      return () => {}
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || !user?.uid) return // Ensure user is loaded

    try {
      const messageData = {
        conversationId: activeConversation.id,
        senderId: user.uid,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false, // Message is unread for the recipient initially
        participants: [user.uid, activeConversation.user.id]
      }

      // Add message to messages subcollection
      await addDoc(collection(db, "messages"), messageData)

      // Update conversation document
      const conversationRef = doc(db, "conversations", activeConversation.id)
      // Construct the update object carefully to avoid overwriting unread counts for other participants
      const updateObject = {
        lastMessage: {
          content: newMessage.trim(),
          timestamp: serverTimestamp(),
          read: false, // Indicates the last message is unread by the recipient
        },
        lastMessageAt: serverTimestamp(),
      };

      // Only increment the unread count for the recipient, ensuring it doesn't affect others
      const recipientId = activeConversation.user.id;
      if (recipientId && user.uid !== recipientId) { // Ensure recipientId is valid and not the sender
          updateObject[`unreadCount.${recipientId}`] = increment(1);
      } else if (user.uid === recipientId) {
          // If sending to self, maybe reset unread count for self or handle differently if needed
          // For now, we won't increment for sending to self
      }

      await updateDoc(conversationRef, updateObject);

    setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBackToList = () => {
    setShowConversation(false)
  }

  const handleViewProfile = () => {
    if (activeConversation) {
      setShowUserProfile(true)
    }
  }

  const handleCreateConversation = async (friend) => {
    if (!user?.uid) return

    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => conv.user.id === friend.id)
      if (existingConversation) {
        handleSelectConversation(existingConversation)
        return
      }

      // Create new conversation
      const conversationData = {
        participants: [user.uid, friend.id],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessage: {
          content: "You are now connected",
          timestamp: serverTimestamp(),
          read: false
        },
        unreadCount: {
          [user.uid]: 0,
          [friend.id]: 1
        }
      }

      const conversationRef = await addDoc(collection(db, "conversations"), conversationData)
      
      // Create the new conversation object
      const newConversation = {
        id: conversationRef.id,
        ...conversationData,
        user: friend,
        lastMessage: {
          content: "You are now connected",
          timestamp: new Date(),
          read: false
        },
        unread: 0
      }

      // Select the new conversation
      handleSelectConversation(newConversation)
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast({
        title: "Error",
        description: "Failed to create conversation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredConversations = conversations.filter((conversation) =>
    conversation.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile view */}
      <div className="md:hidden flex flex-col h-full">
        {/* Mobile Content - Switches between list and conversation */}
        <div className="flex-1 overflow-y-auto">
          {showConversation ? (
            // Active conversation messages area
            <div className="flex flex-col h-full">
              {/* Active conversation details header */}
              {activeConversation && (
                <div className="flex items-center p-3 border-b bg-background">
                  <Button variant="ghost" size="icon" onClick={handleBackToList} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage
                        src={activeConversation.user.avatar || "/placeholder.svg"}
                        alt={activeConversation.user.name}
                      />
                      <AvatarFallback>{activeConversation.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {activeConversation.user.online && (
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-background"></span>
                    )}
                  </div>
                  <div className="flex-1 mr-2">
                    <h3 className="font-medium text-sm truncate">{activeConversation.user.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {activeConversation.user.online ? "Active now" : formatLastSeen(activeConversation.user.lastSeen)}
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="View Profile">
                        <Info className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Profile Information</DialogTitle>
                      </DialogHeader>
                      <UserProfile user={activeConversation.user} />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-16">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Avatar className="h-24 w-24 mb-4 border-4 border-primary/10">
                      <AvatarImage
                        src={activeConversation.user.avatar || "/placeholder.svg"}
                        alt={activeConversation.user.name}
                      />
                      <AvatarFallback className="text-2xl">{activeConversation.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold mb-1">{activeConversation.user.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <span>{activeConversation.user.department}</span>
                      <span>•</span>
                      <span>{activeConversation.user.campus || "MINSU"}</span>
                    </div>
                    <p className="text-muted-foreground">Say hello to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.senderId === user.uid
                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        {!isCurrentUser && (
                          <Avatar className="h-8 w-8 mr-2 self-end mb-1">
                            <AvatarImage
                              src={activeConversation.user.avatar || "/placeholder.svg"}
                              alt={activeConversation.user.name}
                            />
                            <AvatarFallback>{activeConversation.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-2xl p-3`}
                        >
                          <p>{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                          >
                            {formatMessageTime(message.timestamp)}
                            {isCurrentUser && message.read && (
                              <span className="ml-1">✓✓</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              {/* Message input form */}
              {activeConversation && (
                <form onSubmit={handleSendMessage} className="p-3 border-t bg-background">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="rounded-full"
                    />
                    <Button type="submit" size="icon" className="rounded-full" disabled={!newMessage.trim()}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            // Conversation list area
            <div className="flex flex-col h-full">
              {/* Back button and search */}
              <div className="flex items-center p-3 border-b">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/user">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
                <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              className="pl-9 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
              <div className="flex-1 overflow-y-auto pb-16">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
                ) : friends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="bg-muted rounded-full p-6 mb-4">
                      <UserPlus className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">No Friends Yet</h2>
                    <p className="text-muted-foreground mb-4">Add some friends to start messaging</p>
                    <Button asChild>
                      <Link href="/user/friends">Add Friends</Link>
                    </Button>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                      className={`flex items-center p-3 hover:bg-muted/50 cursor-pointer ${activeConversation?.id === conversation.id ? "bg-muted" : ""}`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage src={conversation.user.avatar || "/placeholder.svg"} alt={conversation.user.name} />
                    <AvatarFallback>{conversation.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                        {/* Keep online status green dot */}
                  {conversation.user.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                  )}
                </div>
                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{conversation.user.name}</h3>
                          {/* Re-add last message timestamp */}
                          {conversation.lastMessage?.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(conversation.lastMessage.timestamp)}
                    </span>
                          )}
                  </div>
                        {/* Re-add last message content */}
                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage?.content || ""}</p>
                        {/* Removed department and campus from list item */}
                        {/* Keep active status below name/last message */}
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.user.online ? "Active now" : formatLastSeen(conversation.user.lastSeen)}
                        </p>
                      </div>
                      {/* Re-add unread badge */}
                    {conversation.unread > 0 && (
                        <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unread}
                      </span>
                    )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">No conversations found</div>
          )}
        </div>
              {/* Floating create button */}
              {friends.length > 0 && (
                <div className="fixed bottom-20 right-4">
              <Dialog>
                <DialogTrigger asChild>
                      <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                        <Plus className="h-6 w-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                        <DialogTitle>New Message</DialogTitle>
                        <DialogDescription>Select a friend to start a conversation</DialogDescription>
                  </DialogHeader>
                      <div className="max-h-[60vh] overflow-y-auto">
                        {friends.map((friend) => (
                          <div
                            key={friend.id}
                            className="flex items-center p-3 hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              const existingConversation = conversations.find(
                                conv => conv.user.id === friend.id
                              )
                              if (existingConversation) {
                                handleSelectConversation(existingConversation)
                              } else {
                                handleCreateConversation(friend)
                              }
                            }}
                          >
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                              <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{friend.name}</h3>
                              <p className="text-sm text-muted-foreground">{friend.department}</p>
                    </div>
                  </div>
                        ))}
            </div>
                    </DialogContent>
                  </Dialog>
              </div>
        )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop view - Split screen */}
      <div className="hidden md:flex h-full">
        {/* Conversation list column */}
        <div className="w-1/3 border-r flex flex-col h-full relative">
          {/* Back button and search */}
          <div className="flex items-center p-3 border-b">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/user">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                className="pl-9 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="bg-muted rounded-full p-6 mb-4">
                  <UserPlus className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No Friends Yet</h2>
                <p className="text-muted-foreground mb-4">Add some friends to start messaging</p>
                <Button asChild>
                  <Link href="/user/friends">Add Friends</Link>
                </Button>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center p-3 hover:bg-muted/50 cursor-pointer ${activeConversation?.id === conversation.id ? "bg-muted" : ""}`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                      <AvatarImage src={conversation.user.avatar || "/placeholder.svg"} alt={conversation.user.name} />
                      <AvatarFallback>{conversation.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {/* Keep online status green dot */}
                    {conversation.user.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                    )}
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium truncate">{conversation.user.name}</h3>
                      {/* Re-add last message timestamp */}
                      {conversation.lastMessage?.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(conversation.lastMessage.timestamp)}
                      </span>
                      )}
                    </div>
                    {/* Re-add last message content */}
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage?.content || ""}</p>
                    {/* Removed department and campus from list item */}
                    {/* Keep active status below name/last message */}
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.user.online ? "Active now" : formatLastSeen(conversation.user.lastSeen)}
                    </p>
                  </div>
                  {/* Re-add unread badge */}
                      {conversation.unread > 0 && (
                    <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conversation.unread}
                        </span>
                      )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">No conversations found</div>
            )}
          </div>
          {/* Floating create button for desktop - Fixed position within list side */}
          {friends.length > 0 && (
            <div className="absolute bottom-4 right-4 z-10">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                    <Plus className="h-6 w-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                    <DialogDescription>Select a friend to start a conversation</DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center p-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          const existingConversation = conversations.find(
                            conv => conv.user.id === friend.id
                          )
                          if (existingConversation) {
                            handleSelectConversation(existingConversation)
                          } else {
                            handleCreateConversation(friend)
                          }
                        }}
                      >
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{friend.name}</h3>
                          <p className="text-sm text-muted-foreground">{friend.department}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Conversation view column */}
        <div className="w-2/3 flex flex-col h-full">
          {activeConversation ? (
            <>
              {/* Restore Active conversation header */}
              <div className="flex items-center p-3 border-b">
                <div className="relative">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage
                    src={activeConversation.user.avatar || "/placeholder.svg"}
                    alt={activeConversation.user.name}
                  />
                  <AvatarFallback>{activeConversation.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                  {activeConversation.user.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{activeConversation.user.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {activeConversation.user.online ? "Active now" : formatLastSeen(activeConversation.user.lastSeen)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="View Profile">
                      <Info className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Profile Information</DialogTitle>
                    </DialogHeader>
                    <UserProfile user={activeConversation.user} />
                  </DialogContent>
                </Dialog>
              </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Avatar className="h-24 w-24 mb-4 border-4 border-primary/10">
                      <AvatarImage
                        src={activeConversation.user.avatar || "/placeholder.svg"}
                        alt={activeConversation.user.name}
                      />
                      <AvatarFallback className="text-2xl">{activeConversation.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold mb-1">{activeConversation.user.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <span>{activeConversation.user.department}</span>
                      <span>•</span>
                      <span>{activeConversation.user.campus || "MINSU"}</span>
                    </div>
                    <p className="text-muted-foreground">Say hello to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.senderId === user.uid
                  return (
                    <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8 mr-2 self-end mb-1">
                          <AvatarImage
                            src={activeConversation.user.avatar || "/placeholder.svg"}
                            alt={activeConversation.user.name}
                          />
                          <AvatarFallback>{activeConversation.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-2xl p-3`}
                      >
                        <p>{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                        >
                          {formatMessageTime(message.timestamp)}
                            {isCurrentUser && message.read && (
                              <span className="ml-1">✓✓</span>
                            )}
                        </p>
                      </div>
                    </div>
                  )
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="rounded-full"
                  />
                  <Button type="submit" size="icon" className="rounded-full" disabled={!newMessage.trim()}>
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="bg-muted rounded-full p-6 mb-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
              <p className="text-muted-foreground mb-4">Select a conversation or start a new one to begin messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
