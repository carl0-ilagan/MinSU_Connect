"use client"

import { useState, useEffect, useRef } from "react"
import { PageBanner } from "@/components/ui/page-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Eye, CheckCircle, Star, Reply, Send, ArrowUpDown, ChevronLeft, ChevronRight, Edit2, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from "firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [responseText, setResponseText] = useState("")
  const [respondingId, setRespondingId] = useState(null)
  const [markingReviewId, setMarkingReviewId] = useState(null)
  const [popoverId, setPopoverId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState("latest")
  const popoverRef = useRef(null)
  const ITEMS_PER_PAGE = 5
  const [editingReply, setEditingReply] = useState(null)
  const [editedReply, setEditedReply] = useState("")
  const { user } = useAuth()
  const [showEditReplyDialog, setShowEditReplyDialog] = useState(false)
  const [isEditingReply, setIsEditingReply] = useState(false)
  const [replyToEdit, setReplyToEdit] = useState(null)

  useEffect(() => {
    const feedbackRef = collection(db, "feedback")
    let feedbackQuery = query(feedbackRef)

    // Apply sorting
    if (sortOrder === "latest") {
      feedbackQuery = query(feedbackRef, orderBy("createdAt", "desc"))
    } else if (sortOrder === "oldest") {
      feedbackQuery = query(feedbackRef, orderBy("createdAt", "asc"))
    } else if (sortOrder === "pending") {
      feedbackQuery = query(feedbackRef, where("status", "==", "pending"), orderBy("createdAt", "desc"))
    } else if (sortOrder === "reviewed") {
      feedbackQuery = query(feedbackRef, where("status", "==", "Reviewed"), orderBy("createdAt", "desc"))
    }

    const unsubscribe = onSnapshot(
      feedbackQuery,
      (snapshot) => {
        const feedbackItems = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            message: data.message,
            rating: data.rating,
            userPhoto: data.userPhoto || "/placeholder.svg",
            userName: data.userName || "Anonymous",
            category: data.category || "other",
            status: data.status || "pending",
            reviewed: data.reviewed || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            adminReply: data.adminReply || "",
            repliedAt: data.repliedAt ? data.repliedAt.toDate() : null,
            repliedBy: data.repliedBy || null,
          }
        })
        setFeedback(feedbackItems)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching feedback:", error)
        setError("Failed to load feedback. Please try again.")
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [sortOrder])

  // Calculate pagination
  const totalPages = Math.ceil(feedback.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentFeedback = feedback.slice(startIndex, endIndex)

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPopoverId(null)
      }
    }
    if (popoverId !== null) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [popoverId])

  const handleMarkAsReviewed = async (id) => {
    setMarkingReviewId(id)
    try {
      const feedbackRef = doc(db, "feedback", id)
      await updateDoc(feedbackRef, { reviewed: true, status: "Reviewed" })
      setFeedback((prev) => prev.map(item => item.id === id ? { ...item, reviewed: true, status: "Reviewed" } : item))
    } catch (err) {
      alert("Failed to mark as reviewed.")
    }
    setMarkingReviewId(null)
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const feedbackRef = doc(db, "feedback", id)
      await updateDoc(feedbackRef, { status: newStatus })
      setFeedback((prev) => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))
    } catch (err) {
      alert("Failed to update status.")
    }
  }

  const handleRespond = async (id) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to reply",
        variant: "destructive",
      })
      return
    }

    if (!responseText.trim()) return
    setRespondingId(id)
    try {
      const feedbackRef = doc(db, "feedback", id)
      await updateDoc(feedbackRef, {
        adminReply: responseText,
        repliedAt: new Date(),
        status: "Reviewed",
        reviewed: true,
        repliedBy: user.uid
      })
      setFeedback((prev) => prev.map(item => 
        item.id === id ? { 
          ...item, 
          adminReply: responseText, 
          repliedAt: new Date(), 
          status: "Reviewed", 
          reviewed: true,
          repliedBy: user.uid 
        } : item
      ))
      setResponseText("")
      setPopoverId(null)
      toast({
        title: "Success",
        description: "Reply sent successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      })
    }
    setRespondingId(null)
  }

  const handleEditReply = async (id) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to edit replies",
        variant: "destructive",
      })
      return
    }

    if (!editedReply.trim()) return
    setIsEditingReply(true)
    try {
      const feedbackRef = doc(db, "feedback", id)
      await updateDoc(feedbackRef, {
        adminReply: editedReply,
        repliedAt: new Date(),
        repliedBy: user.uid
      })
      setFeedback((prev) => prev.map(item => 
        item.id === id ? { ...item, adminReply: editedReply, repliedAt: new Date(), repliedBy: user.uid } : item
      ))
      setShowEditReplyDialog(false)
      setEditedReply("")
      setReplyToEdit(null)
      toast({
        title: "Success",
        description: "Reply updated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update reply",
        variant: "destructive",
      })
    } finally {
      setIsEditingReply(false)
    }
  }

  return (
    <>
      <PageBanner
        title="Feedback & Support"
        description="View user feedback and support requests"
        icon={<MessageSquare className="h-6 w-6 text-white" />}
      />

      <Card className="shadow-md border-0 rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold">Feedback</CardTitle>
              <CardDescription>
                {isLoading ? "Loading..." : `${feedback.length} feedback items`}
              </CardDescription>
            </div>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest to Oldest</SelectItem>
                <SelectItem value="oldest">Oldest to Latest</SelectItem>
                <SelectItem value="pending">Pending First</SelectItem>
                <SelectItem value="reviewed">Reviewed First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <FeedbackSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : currentFeedback.length > 0 ? (
            <>
              <div className="space-y-4">
                {currentFeedback.map((item) => {
                  const status = typeof item.status === 'string' && item.status.trim() ? item.status.trim() : 'Pending';
                  const statusLower = status.toLowerCase();
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col p-6 border rounded-xl shadow-lg bg-white hover:bg-muted/40 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-4 mb-2">
                        <Avatar className="h-12 w-12 border-2 border-primary/20 shadow">
                          <AvatarImage src={item.userPhoto} alt={item.userName} />
                          <AvatarFallback>{(item.userName || "U").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{item.userName}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusLower === 'reviewed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {statusLower === 'reviewed' ? 'Reviewed' : 'Pending'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {item.category || 'General'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground block">Posted {formatDistanceToNow(item.createdAt, { addSuffix: true })}</span>
                        </div>
                        {typeof item.rating === "number" && (
                          <div className="flex items-center ml-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-5 w-5 ${i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            ))}
                            <span className="ml-1 text-xs text-muted-foreground">{item.rating}/5</span>
                          </div>
                        )}
                        <div className="ml-auto flex items-center gap-2">
                          <Select
                            value={item.status === 'Reviewed' ? 'Reviewed' : 'Pending'}
                            onValueChange={(value) => handleStatusChange(item.id, value)}
                            disabled={!!item.adminReply}
                          >
                            <SelectTrigger className="h-8 w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Reviewed">Reviewed</SelectItem>
                            </SelectContent>
                          </Select>
                          {!item.adminReply ? (
                            <div className="relative">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPopoverId(popoverId === item.id ? null : item.id)}
                                aria-label="Reply"
                              >
                                <Reply className="h-4 w-4" />
                              </Button>
                              {popoverId === item.id && (
                                <div
                                  ref={popoverRef}
                                  className="absolute right-0 z-50 mt-2 w-64 bg-white border border-border rounded-xl shadow-lg p-4"
                                >
                                  <div className="flex items-center gap-2">
                                    <Textarea
                                      placeholder="Type your response..."
                                      value={responseText}
                                      onChange={(e) => setResponseText(e.target.value)}
                                      className="min-h-[40px] flex-1 resize-none"
                                      autoFocus
                                    />
                                    <Button
                                      size="icon"
                                      onClick={() => { handleRespond(item.id); setPopoverId(null); }}
                                      disabled={!responseText.trim()}
                                      loading={respondingId === item.id ? true : undefined}
                                      className="flex items-center justify-center h-10 w-10"
                                      tabIndex={0}
                                      aria-label="Send reply"
                                    >
                                      <Send className="h-5 w-5" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setReplyToEdit(item.id)
                                  setEditedReply(item.adminReply)
                                  setShowEditReplyDialog(true)
                                }}
                                aria-label="Edit reply"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {!item.adminReply ? (
                        <p className="text-base text-gray-800 mb-2">{item.message || "No feedback provided."}</p>
                      ) : (
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex">
                            <div className="bg-gray-100 rounded-2xl px-4 py-2 max-w-lg text-sm text-gray-900 shadow-sm">
                              {item.message}
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <div className="bg-green-100 rounded-2xl px-4 py-2 max-w-lg text-sm text-green-900 shadow-sm">
                              <span className="font-medium">Admin:</span> {item.adminReply}
                              <div className="text-xs text-muted-foreground mt-1 text-right">
                                {item.repliedAt ? `Responded ${formatDistanceToNow(item.repliedAt, { addSuffix: true })}` : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="transition-all duration-200"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No feedback yet</h3>
              <p className="text-muted-foreground">Feedback will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Edit Reply Dialog */}
      <Dialog open={showEditReplyDialog} onOpenChange={setShowEditReplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reply</DialogTitle>
            <DialogDescription>
              Make changes to your reply below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reply</label>
              <Textarea
                value={editedReply}
                onChange={(e) => setEditedReply(e.target.value)}
                placeholder="Edit your reply..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditReplyDialog(false)
                setEditedReply("")
                setReplyToEdit(null)
              }}
              disabled={isEditingReply}
            >
              Cancel
            </Button>
            <Button
              onClick={() => replyToEdit && handleEditReply(replyToEdit)}
              disabled={isEditingReply || !editedReply.trim()}
            >
              {isEditingReply ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function FeedbackSkeleton() {
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
      <div className="h-4 w-3/4 bg-muted rounded"></div>
    </div>
  )
}
