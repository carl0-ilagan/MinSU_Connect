"use client"

import { useState, useEffect } from "react"
import { PageBanner } from "@/components/ui/page-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, Check, X, Eye, Loader2, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, doc, updateDoc, onSnapshot } from "firebase/firestore"
import { createPostApprovedNotification, createPostDeclinedNotification } from "@/lib/notification-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Helper function for reaction emojis
const getReactionEmoji = (type) => {
  const emojiMap = {
    like: "👍",
    love: "❤️",
    haha: "😂",
    wow: "😮",
    sad: "😢",
    angry: "😠",
    care: "🤗"
  };
  return emojiMap[type] || type;
};

// Stats Modal Component
const StatsModal = ({ post, isOpen, onClose }) => {
  if (!post) return null;

  const reactionCounts = post.reactions ? Object.values(post.reactions).reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {}) : {};

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post Statistics</DialogTitle>
          <DialogDescription>Detailed view of reactions and comments</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reactions Section */}
          <div className="space-y-4">
            <h3 className="font-semibold">Reactions</h3>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="space-y-2">
                {Object.entries(reactionCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{getReactionEmoji(type)}</span>
                      <span className="capitalize">{type}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${(count / totalReactions) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="font-semibold">Comments</h3>
            <div className="bg-muted/30 p-4 rounded-lg max-h-[300px] overflow-y-auto">
              {post.commentList && post.commentList.length > 0 ? (
                <div className="space-y-4">
                  {post.commentList.map((comment, index) => (
                    <div key={index} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.userAvatar || "/placeholder.svg"} />
                        <AvatarFallback>{comment.userName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function PostModerationPage() {
  const [posts, setPosts] = useState({
    pending: [],
    approved: [],
    declined: [],
    reviewed: [],
  })
  const [allPosts, setAllPosts] = useState({
    pending: [],
    approved: [],
    declined: [],
    reviewed: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPost, setSelectedPost] = useState(null)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [declineReason, setDeclineReason] = useState("")
  const [processingPost, setProcessingPost] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState("pending")
  const { toast } = useToast()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(5)

  const [showStatsModal, setShowStatsModal] = useState(false)
  const [statsPost, setStatsPost] = useState(null)

  useEffect(() => {
    // Set up real-time listeners for each status
    const unsubscribes = setupPostsListeners()

    // Cleanup listeners on unmount
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    }
  }, [])

  useEffect(() => {
    // Update paginated posts when all posts or page changes
    updatePaginatedPosts()
  }, [allPosts, currentPage, selectedStatus, searchQuery])

  // Set up real-time listeners for posts
  const setupPostsListeners = () => {
    const unsubscribes = []

    // All posts listener
    const allRef = collection(db, "posts")
    const allQuery = query(allRef, orderBy("createdAt", "desc"))
    const allUnsubscribe = onSnapshot(allQuery, (snapshot) => {
      const allPosts = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          user: {
            id: data.userId,
            name: data.userName || "Unknown User",
            avatar: data.userAvatar || data.profileImage || data.photoURL || "/diverse-woman-portrait.png",
          },
          content: data.content,
          image: data.image,
          timestamp: data.createdAt?.toDate() || new Date(),
          status: data.status,
          declineReason: data.feedback,
          likes: data.likes || 0,
          reactions: data.reactions || {},
          commentList: data.commentList || [],
        }
      })
      setAllPosts((prev) => ({ ...prev, all: allPosts }))
    })

    unsubscribes.push(allUnsubscribe)

    // Pending posts listener
    const pendingRef = collection(db, "posts")
    const pendingQuery = query(pendingRef, where("status", "==", "pending"), orderBy("createdAt", "desc"))

    const pendingUnsubscribe = onSnapshot(pendingQuery, (snapshot) => {
      const pendingPosts = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          user: {
            id: data.userId,
            name: data.userName || "Unknown User",
            avatar: data.userAvatar || data.profileImage || data.photoURL || "/diverse-woman-portrait.png",
          },
          content: data.content,
          image: data.image,
          timestamp: data.createdAt?.toDate() || new Date(),
          status: data.status,
          declineReason: data.feedback,
          likes: data.likes || 0,
          reactions: data.reactions || {},
          commentList: data.commentList || [],
        }
      })

      setAllPosts((prev) => ({ ...prev, pending: pendingPosts }))
      setIsLoading(false)
    })

    unsubscribes.push(pendingUnsubscribe)

    // Approved posts listener
    const approvedRef = collection(db, "posts")
    const approvedQuery = query(approvedRef, where("status", "==", "approved"), orderBy("createdAt", "desc"))

    const approvedUnsubscribe = onSnapshot(approvedQuery, (snapshot) => {
      const approvedPosts = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          user: {
            id: data.userId,
            name: data.userName || "Unknown User",
            avatar: data.userAvatar || data.profileImage || data.photoURL || "/diverse-woman-portrait.png",
          },
          content: data.content,
          image: data.image,
          timestamp: data.createdAt?.toDate() || new Date(),
          status: data.status,
          declineReason: data.feedback,
          likes: data.likes || 0,
          reactions: data.reactions || {},
          commentList: data.commentList || [],
        }
      })

      setAllPosts((prev) => ({ ...prev, approved: approvedPosts }))
    })

    unsubscribes.push(approvedUnsubscribe)

    // Declined posts listener
    const declinedRef = collection(db, "posts")
    const declinedQuery = query(declinedRef, where("status", "==", "declined"), orderBy("createdAt", "desc"))

    const declinedUnsubscribe = onSnapshot(declinedQuery, (snapshot) => {
      const declinedPosts = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          user: {
            id: data.userId,
            name: data.userName || "Unknown User",
            avatar: data.userAvatar || data.profileImage || data.photoURL || "/diverse-woman-portrait.png",
          },
          content: data.content,
          image: data.image,
          timestamp: data.createdAt?.toDate() || new Date(),
          status: data.status,
          declineReason: data.feedback,
          likes: data.likes || 0,
          reactions: data.reactions || {},
          commentList: data.commentList || [],
        }
      })

      setAllPosts((prev) => ({ ...prev, declined: declinedPosts }))
    })

    unsubscribes.push(declinedUnsubscribe)

    return unsubscribes
  }

  // Update paginated posts
  const updatePaginatedPosts = () => {
    // Get the correct posts array based on selectedStatus
    const statusPosts = allPosts[selectedStatus] || []
    
    // Filter posts based on search query
    const filteredPosts = statusPosts.filter(
      (post) =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Apply pagination
    const startIndex = (currentPage - 1) * postsPerPage
    const endIndex = startIndex + postsPerPage
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex)

    setPosts((prev) => ({
      ...prev,
      [selectedStatus]: paginatedPosts
    }))
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page on new search
  }

  const performSearch = () => {
    // Search is handled in updatePaginatedPosts
    // Just reset to first page
    setCurrentPage(1)
  }

  const handleNextPage = () => {
    const statusPosts = allPosts[selectedStatus] || []
    const filteredPosts = statusPosts.filter(
      (post) =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Filter posts based on selected status
  const getFilteredPostsByStatus = () => {
    return allPosts[selectedStatus] || []
  }

  const handleViewPost = (post) => {
    setSelectedPost(post)
  }

  const handleApprovePost = async (postId) => {
    console.log("Attempting to approve post with ID:", postId);
    setProcessingPost(postId)

    try {
      const postRef = doc(db, "posts", postId)
      await updateDoc(postRef, {
        status: "approved",
        moderatedAt: new Date(),
      })

      // Find the post to get the user ID
      const postToApprove = allPosts.pending.find((post) => post.id === postId)

      if (postToApprove) {
        console.log("Post found, attempting to create approval notification for user ID:", postToApprove.user.id);
        // Create notification for the post owner
        try {
          await createPostApprovedNotification(postToApprove.user.id, postId)
        } catch (notifError) {
          console.error("Error creating post approval notification:", notifError)
        }

        // Update local state for immediate feedback
        setAllPosts((prev) => ({
          ...prev,
          pending: prev.pending.filter((post) => post.id !== postId),
          approved: [...prev.approved, { ...postToApprove, status: "approved" }],
          all: [...prev.all.filter(post => post.id !== postId), { ...postToApprove, status: "approved" }]
        }))
      }

      toast({
        title: "Post Approved",
        description: "The post has been approved and is now visible to users.",
      })
    } catch (error) {
      console.error("Error approving post:", error)
      toast({
        title: "Error",
        description: "Failed to approve post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingPost(null)
    }
  }

  const handleDeclineClick = (post) => {
    setSelectedPost(post)
    setShowDeclineDialog(true)
  }

  const handleDeclinePost = async () => {
    if (!selectedPost) return

    console.log("Attempting to decline post with ID:", selectedPost.id);
    setProcessingPost(selectedPost.id)
    setShowDeclineDialog(false)

    try {
      const postRef = doc(db, "posts", selectedPost.id)
      await updateDoc(postRef, {
        status: "declined",
        feedback: declineReason,
        moderatedAt: new Date(),
        archived: true,
      })

      // Create notification for the post owner
      try {
        console.log("Attempting to create declined notification for user ID:", selectedPost.user.id, "with reason:", declineReason);
        await createPostDeclinedNotification(selectedPost.user.id, selectedPost.id, declineReason)
      } catch (notifError) {
        console.error("Error creating post declined notification:", notifError)
      }

      // Update local state for immediate feedback
      setAllPosts((prev) => ({
        ...prev,
        pending: prev.pending.filter((post) => post.id !== selectedPost.id),
        declined: [...prev.declined, { ...selectedPost, status: "declined", declineReason }],
        all: [...prev.all.filter(post => post.id !== selectedPost.id), { ...selectedPost, status: "declined", declineReason }]
      }))

      toast({
        title: "Post Declined",
        description: "The post has been declined and the user has been notified.",
      })
    } catch (error) {
      console.error("Error declining post:", error)
      toast({
        title: "Error",
        description: "Failed to decline post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingPost(null)
      setDeclineReason("")
      setSelectedPost(null)
    }
  }

  return (
    <>
      <PageBanner
        title="Post Moderation"
        description="Review and moderate user-submitted content"
        icon={<FileText className="h-6 w-6 text-white" />}
      />

      <Card className="shadow-md border-0 rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Content Moderation</CardTitle>
              <CardDescription>
                {isLoading ? "Loading..." : `${posts[selectedStatus].length} posts shown (${getFilteredPostsByStatus().length} total)`}
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-stretch md:items-center">
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => { 
                  setSelectedStatus(value)
                  setCurrentPage(1) // Reset to first page when changing status
                  setSearchQuery("") // Reset search when changing status
                }}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending ({allPosts.pending.length})</SelectItem>
                  <SelectItem value="approved">Approved ({allPosts.approved.length})</SelectItem>
                  <SelectItem value="declined">Declined ({allPosts.declined.length})</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={handleSearch}
                  onKeyDown={(e) => e.key === "Enter" && performSearch()}
                  className="pl-10 bg-muted/50 border rounded-l-full focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button onClick={performSearch} className="rounded-r-full">
                Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <PostModerationSkeleton key={i} />
              ))}
            </div>
          ) : posts[selectedStatus].length > 0 ? (
            <div className="space-y-4">
              {posts[selectedStatus].map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                      <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.name} />
                      <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{post.user.name}</h3>
                      <div className="flex items-center">
                        <Badge variant="outline" className={`text-xs border-blue-200 ${post.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : post.status === "approved" ? "bg-green-50 text-green-700 border-green-200" : post.status === "declined" ? "bg-red-50 text-red-700 border-red-200" : post.status === "reviewed" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-blue-50 text-blue-700"}`}>
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-2">
                          Posted {formatDistanceToNow(post.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm mb-3">{post.content}</p>
                  {post.image && (
                    <div className="relative rounded-lg overflow-hidden mb-3 max-h-[200px]">
                      <Image
                        src={post.image || "/placeholder.svg"}
                        alt="Post image"
                        width={600}
                        height={400}
                        className="w-full object-cover"
                        onError={(e) => {
                          console.error("Error loading post image:", e)
                          e.target.src = "/placeholder.svg"
                        }}
                      />
                    </div>
                  )}
                  {post.declineReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                      <p className="text-sm font-medium text-red-700">Reason for declining:</p>
                      <p className="text-sm text-red-600">{post.declineReason}</p>
                    </div>
                  )}
                  {post.status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => handleApprovePost(post.id)}
                        disabled={processingPost === post.id}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {processingPost === post.id ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => handleDeclineClick(post)}
                        disabled={processingPost === post.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium">Likes:</span> {post.likes || 0}
                      {post.reactions && Object.keys(post.reactions).length > 0 && (
                        <span className="text-muted-foreground">
                          ({Object.entries(
                            Object.values(post.reactions).reduce((acc, type) => {
                              acc[type] = (acc[type] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([type, count]) => `${getReactionEmoji(type)} ${count}`).join(", ")})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Comments:</span>
                      <span>{post.commentList?.length || 0}</span>
                      <Button 
                        size="xs" 
                        variant="outline" 
                        className="ml-2 px-2 py-1 rounded-full text-xs" 
                        onClick={() => { 
                          setStatsPost(post); 
                          setShowStatsModal(true); 
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {/* Pagination Controls */}
              {getFilteredPostsByStatus().length > postsPerPage && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <span className="text-sm font-medium">
                    Page {currentPage} of {Math.ceil(getFilteredPostsByStatus().length / postsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= Math.ceil(getFilteredPostsByStatus().length / postsPerPage)}
                    className="transition-all duration-200"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No posts found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No posts match your search criteria" : `No ${selectedStatus} posts available`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Detail Dialog */}
      {selectedPost && (
        <Dialog open={!!selectedPost && !showDeclineDialog} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Post Details</DialogTitle>
              <DialogDescription>Review post content before moderation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/10">
                  <AvatarImage src={selectedPost.user.avatar || "/placeholder.svg"} alt={selectedPost.user.name} />
                  <AvatarFallback>{selectedPost.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedPost.user.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    Posted {formatDistanceToNow(selectedPost.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedPost.content}</p>
              </div>

              {selectedPost.image && (
                <div className="relative rounded-lg overflow-hidden">
                  <Image
                    src={selectedPost.image || "/placeholder.svg"}
                    alt="Post image"
                    width={600}
                    height={400}
                    className="w-full object-contain max-h-[300px]"
                    onError={(e) => {
                      console.error("Error loading post image:", e)
                      e.target.src = "/placeholder.svg"
                    }}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="rounded-full sm:order-1 sm:ml-2"
                onClick={() => handleDeclineClick(selectedPost)}
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button
                className="rounded-full sm:order-2 sm:ml-2"
                onClick={() => {
                  handleApprovePost(selectedPost.id)
                  setSelectedPost(null)
                }}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline Post</DialogTitle>
            <DialogDescription>Provide a reason for declining this post</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarImage src={selectedPost?.user.avatar || "/placeholder.svg"} alt={selectedPost?.user.name} />
                <AvatarFallback>{selectedPost?.user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{selectedPost?.user.name}</h3>
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {selectedPost?.content.substring(0, 50)}...
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decline-reason">Reason for declining</Label>
              <Textarea
                id="decline-reason"
                placeholder="Explain why this post is being declined..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-full sm:order-1 sm:ml-2"
              onClick={() => setShowDeclineDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-full sm:order-2 sm:ml-2"
              onClick={handleDeclinePost}
              disabled={!declineReason.trim()}
            >
              Decline Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Modal */}
      <StatsModal 
        post={statsPost} 
        isOpen={showStatsModal} 
        onClose={() => setShowStatsModal(false)} 
      />
    </>
  );
}

function PostModerationSkeleton() {
  return (
    <div className="flex flex-col p-4 border rounded-lg animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-muted"></div>
        <div>
          <div className="h-4 w-40 bg-muted rounded mb-2"></div>
          <div className="h-3 w-32 bg-muted rounded"></div>
        </div>
      </div>
      <div className="h-4 w-full bg-muted rounded mb-2"></div>
      <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
      <div className="h-4 w-1/2 bg-muted rounded mb-3"></div>
      <div className="h-[150px] w-full bg-muted rounded mb-3"></div>
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-muted rounded-full"></div>
        <div className="h-8 w-24 bg-muted rounded-full"></div>
        <div className="h-8 w-24 bg-muted rounded-full"></div>
      </div>
    </div>
  )
}
