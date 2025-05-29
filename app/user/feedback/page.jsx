"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpCircle, Send, MessageSquare, CheckCircle, Clock, AlertCircle, Loader2, Star, ChevronDown, ChevronLeft, ChevronRight, Eye, Reply, ArrowUpDown, Trash2, Edit2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, limit, startAfter, getDocs, deleteDoc, getDoc } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ITEMS_PER_PAGE = 5;

export default function FeedbackPage() {
  const [rating, setRating] = useState(0)
  const [category, setCategory] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackItems, setFeedbackItems] = useState([])
  const [selectedStatus, setSelectedStatus] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user, userData } = useAuth()
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [adminReply, setAdminReply] = useState({})
  const [userFeedback, setUserFeedback] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0)
  const [editingFeedback, setEditingFeedback] = useState(null)
  const [editedMessage, setEditedMessage] = useState("")
  const [editedCategory, setEditedCategory] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [feedbackToDelete, setFeedbackToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Check if user is admin
  const isAdmin = userData?.role === "admin" || user?.email?.includes("admin") || user?.email?.includes("staff")

  // Fetch feedback items
  useEffect(() => {
    if (!isAdmin) return;

    setIsLoading(true);
    const feedbackRef = collection(db, "feedback");
    const q = query(
      feedbackRef,
      orderBy("createdAt", "desc"),
      limit(ITEMS_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt) || new Date(),
      }));
      setFeedbackItems(items);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching feedback:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to load feedback items.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [isAdmin, toast]);

  const loadMore = async () => {
    if (!lastVisible || !hasMore) return;

    const feedbackRef = collection(db, "feedback");
    const q = query(
      feedbackRef,
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(ITEMS_PER_PAGE)
    );

    const snapshot = await getDocs(q);
    const newItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt) || new Date(),
    }));

    setFeedbackItems(prev => [...prev, ...newItems]);
    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "feedback"), {
        rating: rating || null,
        category,
        message,
        status: "pending",
        userId: user.uid,
        userEmail: user.email,
        userName: userData?.displayName || userData?.firstName + " " + userData?.lastName || "Anonymous",
        userPhoto: userData?.photoURL || user?.photoURL,
        createdAt: serverTimestamp(),
        adminReply: null,
        repliedAt: null,
      });

      setRating(0);
      setCategory("");
      setMessage("");
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback. We'll get back to you soon.",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      await updateDoc(doc(db, "feedback", feedbackId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      toast({
        title: "Status Updated",
        description: "Feedback status has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdminReply = async (feedbackId) => {
    if (!adminReply[feedbackId]?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDoc(doc(db, "feedback", feedbackId), {
        adminReply: adminReply[feedbackId],
        repliedAt: serverTimestamp(),
        repliedBy: user.uid,
      });

      setAdminReply(prev => ({ ...prev, [feedbackId]: "" }));
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <div className="flex items-center text-amber-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>Pending</span>
          </div>
        );
      case "in-progress":
        return (
          <div className="flex items-center text-blue-600">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>In Progress</span>
          </div>
        );
      case "resolved":
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Resolved</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Unknown</span>
          </div>
        );
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 cursor-pointer transition-colors ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
            onClick={() => setRating(star)}
          />
        ))}
      </div>
    );
  };

  // Update the useEffect for fetching user feedback
  useEffect(() => {
    if (!user) return;

    setIsLoadingHistory(true);
    const feedbackRef = collection(db, "feedback");
    const q = query(
      feedbackRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt) || new Date(),
          repliedAt: doc.data().repliedAt?.toDate?.() || null,
          updatedAt: doc.data().updatedAt?.toDate?.() || null,
        }));
        setUserFeedback(items);
      } catch (error) {
        console.error("Error processing feedback data:", error);
        toast({
          title: "Error",
          description: "Failed to process feedback data.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingHistory(false);
      }
    }, (error) => {
      console.error("Error fetching user feedback:", error);
      setIsLoadingHistory(false);
      toast({
        title: "Error",
        description: "Failed to load your feedback history.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handlePreviousFeedback = () => {
    setCurrentFeedbackIndex(prev => Math.max(0, prev - 1))
  }

  const handleNextFeedback = () => {
    setCurrentFeedbackIndex(prev => Math.min(userFeedback.length - 1, prev + 1))
  }

  const handleDeleteFeedback = async (id) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete feedback",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      const feedbackRef = doc(db, "feedback", id)
      const feedbackDoc = await getDoc(feedbackRef)
      const feedbackData = feedbackDoc.data()

      // Check if the current user is the one who created the feedback
      if (feedbackData.userId !== user.uid) {
        toast({
          title: "Error",
          description: "You can only delete your own feedback",
          variant: "destructive",
        })
        return
      }

      // Check if the feedback has been reviewed
      if (feedbackData.status === "Reviewed") {
        toast({
          title: "Error",
          description: "Cannot delete feedback that has been reviewed",
          variant: "destructive",
        })
        return
      }

      await deleteDoc(feedbackRef)
      setUserFeedback((prev) => prev.filter(item => item.id !== id))
      
      // Add success message
      toast({
        title: "Success",
        description: "Feedback deleted successfully",
        variant: "default",
      })
    } catch (err) {
      console.error("Error deleting feedback:", err)
      toast({
        title: "Error",
        description: "Failed to delete feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setFeedbackToDelete(null)
    }
  }

  const handleEditFeedback = async (id) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to edit feedback",
        variant: "destructive",
      })
      return
    }

    if (!editedMessage.trim() || !editedCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsEditing(true)
    try {
      const feedbackRef = doc(db, "feedback", id)
      const feedbackDoc = await getDoc(feedbackRef)
      const feedbackData = feedbackDoc.data()

      // Check if the current user is the one who created the feedback
      if (feedbackData.userId !== user.uid) {
        toast({
          title: "Error",
          description: "You can only edit your own feedback",
          variant: "destructive",
        })
        return
      }

      // Check if the feedback has been reviewed
      if (feedbackData.status === "Reviewed") {
        toast({
          title: "Error",
          description: "Cannot edit feedback that has been reviewed",
          variant: "destructive",
        })
        return
      }

      await updateDoc(feedbackRef, {
        message: editedMessage,
        category: editedCategory,
        updatedAt: serverTimestamp(),
      })

      // Update the local state
      setUserFeedback((prev) => prev.map(item => 
        item.id === id ? { 
          ...item, 
          message: editedMessage, 
          category: editedCategory,
          updatedAt: new Date()
        } : item
      ))

      setShowEditDialog(false)
      setEditedMessage("")
      setEditedCategory("")
      
      toast({
        title: "Success",
        description: "Feedback updated successfully",
        variant: "default",
      })
    } catch (err) {
      console.error("Error updating feedback:", err)
      toast({
        title: "Error",
        description: "Failed to update feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <PageLayout>
      <PageBanner
        title="Feedback & Support"
        description="Send us your feedback, suggestions, or report an issue. We're here to help!"
      />
      <div className="max-w-4xl mx-auto py-6 w-full px-2 sm:px-4 overflow-x-auto">
        {isAdmin ? (
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All Feedback</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
              <div className="flex items-center">
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading feedback...</p>
                  </div>
                ) : feedbackItems.length > 0 ? (
                  feedbackItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-primary/10">
                              <AvatarImage src={item.userPhoto || "/placeholder.svg"} alt={item.userName} />
                              <AvatarFallback>{item.userName?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{item.category}</CardTitle>
                                {item.rating && (
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < item.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            <CardDescription>
                                From {item.userName} • {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-medium">
                              {item.category}
                            </div>
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{item.message}</p>
                        {item.adminReply && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src="/admin-avatar.png" alt="Admin" />
                                <AvatarFallback>A</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">Admin Response</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(item.repliedAt?.toDate?.() || new Date(), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm">{item.adminReply}</p>
                          </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t bg-muted/50 flex justify-between">
                        <div className="flex-1 mr-4">
                          <Textarea
                            placeholder="Type your reply..."
                            value={adminReply[item.id] || ""}
                            onChange={(e) => setAdminReply(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="mb-2"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => handleAdminReply(item.id)}
                            disabled={!adminReply[item.id]?.trim()}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Reply
                      </Button>
                        </div>
                      <div className="flex gap-2">
                          <Select 
                            defaultValue={item.status}
                            onValueChange={(value) => handleStatusUpdate(item.id, value)}
                          >
                          <SelectTrigger className="h-8 w-[130px]">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardFooter>
                  </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No feedback yet</h3>
                    <p className="text-muted-foreground">When users submit feedback, it will appear here</p>
                  </div>
                )}
                {hasMore && (
                  <div className="flex justify-center mt-4">
                    <Button onClick={loadMore} variant="outline">
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-0">
              <div className="grid gap-4">
                {feedbackItems
                  .filter((item) => item.status === "pending")
                  .map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-primary/10">
                              <AvatarImage src={item.userPhoto || "/placeholder.svg"} alt={item.userName} />
                              <AvatarFallback>{item.userName?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{item.category}</CardTitle>
                              <CardDescription>
                                From {item.userName} • {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-medium">
                              {item.category}
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{item.message}</p>
                      </CardContent>
                      <CardFooter className="border-t bg-muted/50 flex justify-between">
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Reply
                        </Button>
                        <div className="flex gap-2">
                          <Select 
                            defaultValue={item.status}
                            onValueChange={(value) => handleStatusUpdate(item.id, value)}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="in-progress" className="mt-0">
              <div className="grid gap-4">
                {feedbackItems
                  .filter((item) => item.status === "in-progress")
                  .map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-primary/10">
                              <AvatarImage src={item.userPhoto || "/placeholder.svg"} alt={item.userName} />
                              <AvatarFallback>{item.userName?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{item.category}</CardTitle>
                              <CardDescription>
                                From {item.userName} • {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-medium">
                              {item.category}
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{item.message}</p>
                      </CardContent>
                      <CardFooter className="border-t bg-muted/50 flex justify-between">
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Reply
                        </Button>
                        <div className="flex gap-2">
                          <Select 
                            defaultValue={item.status}
                            onValueChange={(value) => handleStatusUpdate(item.id, value)}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="resolved" className="mt-0">
              <div className="grid gap-4">
                {feedbackItems
                  .filter((item) => item.status === "resolved")
                  .map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-primary/10">
                              <AvatarImage src={item.userPhoto || "/placeholder.svg"} alt={item.userName} />
                              <AvatarFallback>{item.userName?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{item.category}</CardTitle>
                              <CardDescription>
                                From {item.userName} • {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-medium">
                              {item.category}
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{item.message}</p>
                      </CardContent>
                      <CardFooter className="border-t bg-muted/50 flex justify-between">
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Reply
                        </Button>
                        <div className="flex gap-2">
                          <Select 
                            defaultValue={item.status}
                            onValueChange={(value) => handleStatusUpdate(item.id, value)}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Submit Feedback or Support Request</CardTitle>
                <CardDescription>
                  Share your thoughts, suggestions, or report issues to help us improve MINSU Connect
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Rating (Optional)
                    </label>
                    {renderStars(rating)}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">
                      Category
                    </label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category" className="rounded-lg">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="suggestion">Suggestion</SelectItem>
                        <SelectItem value="content">Content Issue</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Please describe your feedback or issue in detail"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Your Feedback History</CardTitle>
                <CardDescription>View all your submitted feedback and responses</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading your feedback history...</p>
                  </div>
                ) : userFeedback.length > 0 ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="transition-all duration-300 ease-in-out transform">
                        {userFeedback[currentFeedbackIndex] && (
                          <Card className="overflow-hidden">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border-2 border-primary/10">
                                    <AvatarImage src={userFeedback[currentFeedbackIndex].userPhoto || "/placeholder.svg"} alt={userFeedback[currentFeedbackIndex].userName} />
                                    <AvatarFallback>{userFeedback[currentFeedbackIndex].userName?.[0] || "U"}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <CardTitle className="text-lg">{userFeedback[currentFeedbackIndex].userName}</CardTitle>
                                      {userFeedback[currentFeedbackIndex].rating && (
                                        <div className="flex items-center gap-1">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`h-4 w-4 ${i < userFeedback[currentFeedbackIndex].rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <CardDescription>
                                      {formatDistanceToNow(userFeedback[currentFeedbackIndex].createdAt, { addSuffix: true })}
                                    </CardDescription>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${["reviewed","responded","resolved"].includes(userFeedback[currentFeedbackIndex].status?.toLowerCase()) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {["reviewed","responded","resolved"].includes(userFeedback[currentFeedbackIndex].status?.toLowerCase()) ? (
                                      <><CheckCircle className="h-4 w-4 mr-1" />Reviewed</>
                                    ) : (
                                      <><Clock className="h-4 w-4 mr-1" />Pending</>
                                    )}
                                  </span>
                                  {userFeedback[currentFeedbackIndex].status !== "Reviewed" && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setFeedbackToDelete(userFeedback[currentFeedbackIndex].id)
                                          setEditedMessage(userFeedback[currentFeedbackIndex].message)
                                          setEditedCategory(userFeedback[currentFeedbackIndex].category)
                                          setShowEditDialog(true)
                                        }}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setFeedbackToDelete(userFeedback[currentFeedbackIndex].id)
                                          setShowDeleteDialog(true)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {showEditDialog ? (
                                <div className="space-y-4">
                                  <Select value={editedCategory} onValueChange={setEditedCategory}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="technical">Technical Issue</SelectItem>
                                      <SelectItem value="suggestion">Suggestion</SelectItem>
                                      <SelectItem value="content">Content Issue</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Textarea
                                    value={editedMessage}
                                    onChange={(e) => setEditedMessage(e.target.value)}
                                    placeholder="Edit your message..."
                                    className="min-h-[100px]"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setShowEditDialog(false)
                                        setEditedMessage("")
                                        setEditedCategory("")
                                      }}
                                      disabled={isEditing}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => feedbackToDelete && handleEditFeedback(feedbackToDelete)}
                                      disabled={isEditing || !editedMessage.trim() || !editedCategory}
                                    >
                                      {isEditing ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        "Save Changes"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2 mt-2">
                                  <div className="flex">
                                    <div className="bg-gray-100 rounded-2xl px-4 py-2 max-w-lg text-sm text-gray-900 shadow-sm">
                                      {userFeedback[currentFeedbackIndex].message}
                                    </div>
                                  </div>
                                  {userFeedback[currentFeedbackIndex].adminReply && (
                                    <div className="flex justify-end">
                                      <div className="bg-green-100 rounded-2xl px-4 py-2 max-w-lg text-sm text-green-900 shadow-sm">
                                        <span className="font-medium">Admin:</span> {userFeedback[currentFeedbackIndex].adminReply}
                                        <div className="text-xs text-muted-foreground mt-1 text-right">
                                          {userFeedback[currentFeedbackIndex].repliedAt ? `Responded ${formatDistanceToNow(userFeedback[currentFeedbackIndex].repliedAt, { addSuffix: true })}` : ""}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousFeedback}
                          disabled={currentFeedbackIndex === 0}
                          className="transition-all duration-200"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                        <span className="text-sm font-medium">
                          {currentFeedbackIndex + 1} of {userFeedback.length}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextFeedback}
                          disabled={currentFeedbackIndex === userFeedback.length - 1}
                          className="transition-all duration-200"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No feedback submitted yet</h3>
                    <p className="text-muted-foreground">Your submitted feedback will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Find answers to common questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">How do I update my profile?</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to your Profile page and click the Edit Profile button to update your information.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">How do I change my password?</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to Settings &gt; Security to change your password or update your security settings.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">How do I report inappropriate content?</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the three dots menu on any post and select "Report" to notify moderators.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Other ways to reach us</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Email Support</h3>
                  <p className="text-sm text-muted-foreground">support@minsu.edu.ph</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-sm text-muted-foreground">+63 (043) 123-4567</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Office Hours</h3>
                  <p className="text-sm text-muted-foreground">Monday to Friday, 8:00 AM - 5:00 PM</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feedback</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feedback? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setFeedbackToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => feedbackToDelete && handleDeleteFeedback(feedbackToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feedback</DialogTitle>
            <DialogDescription>
              Make changes to your feedback below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={editedCategory} onValueChange={setEditedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="content">Content Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                placeholder="Edit your message..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                setEditedMessage("")
                setEditedCategory("")
              }}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => feedbackToDelete && handleEditFeedback(feedbackToDelete)}
              disabled={isEditing || !editedMessage.trim() || !editedCategory}
            >
              {isEditing ? (
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
    </PageLayout>
  );
}
