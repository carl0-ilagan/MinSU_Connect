'use client';

import { useState, useEffect } from "react";
import Link from "next/link"; // Import Link for navigation
import { PageBanner } from "@/components/ui/page-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, FileText, Clock, Check, X, AlertTriangle, Eye, Archive, Ban } from "lucide-react"; // Added icons for status
import { formatDistanceToNow } from "date-fns";
import { db } from "@/lib/firebase"; // Import db for fetching data
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc, getDoc, getDocs, addDoc, serverTimestamp } from "firebase/firestore"; // Import Firestore functions
import { Badge } from "@/components/ui/badge"; // Import Badge for status
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]); // Renamed 'reports' to 'posts'
  const [allPosts, setAllPosts] = useState([]); // Renamed 'allReports' to 'allPosts'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState(null);
  const { toast } = useToast();
  const [declineReason, setDeclineReason] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(10); // Increased items per page

  // Fetch all reported posts in real-time
  useEffect(() => {
    setIsLoading(true);
    const postsRef = collection(db, "posts");
    const q = query(postsRef, where("isReported", "==", true), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedPosts = await Promise.all(snapshot.docs.map(async (postDoc) => {
        const data = postDoc.data();
        
        // Get reports for this post
        const reportsRef = collection(db, "reports");
        const reportsQuery = query(reportsRef, where("postId", "==", postDoc.id));
        const reportsSnapshot = await getDocs(reportsQuery);
        
        // Get reporter information for each report
        const reports = await Promise.all(reportsSnapshot.docs.map(async (reportDoc) => {
          const reportData = reportDoc.data();
          // Get reporter's user data
          const reporterDoc = await getDoc(doc(db, "users", reportData.reporterId));
          const reporterData = reporterDoc.data();
          
          return {
            ...reportData,
            reporterName: reporterData?.firstName && reporterData?.lastName 
              ? `${reporterData.firstName} ${reporterData.lastName}`
              : reporterData?.displayName || "Unknown User",
            reporterAvatar: reporterData?.profileImage || reporterData?.photoURL || null,
            reportedAt: reportData.reportedAt?.toDate() || new Date()
          };
        }));

        return {
          id: postDoc.id,
          userId: data.userId,
          userName: data.userName || "Unknown User",
          content: data.content,
          status: data.status,
          timestamp: data.createdAt?.toDate() || new Date(),
          reports: reports,
          reactions: data.reactions || {},
          commentList: data.commentList || [],
          likes: data.likes || 0,
          comments: data.comments || 0,
          shares: data.shares || 0
        };
      }));

      setAllPosts(fetchedPosts);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching posts for reports:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to load reported posts. Please try again.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, []);

  // Update paginated and filtered posts when allPosts, page, or search changes
  useEffect(() => {
    updatePaginatedAndFilteredPosts();
  }, [allPosts, currentPage, searchQuery, postsPerPage]);

  // Update paginated and filtered posts
  const updatePaginatedAndFilteredPosts = () => {
    const filteredPosts = allPosts.filter(post =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    setPosts(filteredPosts.slice(startIndex, endIndex));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const totalFilteredPosts = allPosts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.userName.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;
  const totalPages = Math.ceil(totalFilteredPosts / postsPerPage) || 1;

   // Helper to get status badge
   const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" /> Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <X className="h-3 w-3 mr-1" /> Declined
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleViewDetails = (post) => {
    setSelectedPost(post);
    setShowDetailsDialog(true);
  };

  const handleModeratePost = async (action) => {
    if (!selectedPost || !user) return;

    try {
      // First check if user is admin
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      
      if (!userData?.isAdmin) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to moderate posts.",
          variant: "destructive",
        });
        return;
      }

      const postRef = doc(db, "posts", selectedPost.id);
      
      if (action === "reviewed") {
        // Update post status
        await updateDoc(postRef, {
          isReported: false,
          status: "reviewed",
          reviewedAt: serverTimestamp(),
          reviewedBy: user.uid
        });

        // Create moderation log
        const moderationLogRef = collection(db, "moderationLogs");
        await addDoc(moderationLogRef, {
          postId: selectedPost.id,
          action: "reviewed",
          moderatorId: user.uid,
          timestamp: serverTimestamp(),
          postData: {
            userId: selectedPost.userId,
            content: selectedPost.content
          }
        });

        toast({
          title: "Post Marked as Reviewed",
          description: "The post has been marked as reviewed and will remain visible.",
        });
      } else if (action === "decline") {
        if (!declineReason.trim()) {
          toast({
            title: "Error",
            description: "Please provide a reason for declining the post.",
            variant: "destructive",
          });
          return;
        }

        // Update post status
        await updateDoc(postRef, {
          isReported: false,
          status: "declined",
          archived: true,
          declineReason: declineReason.trim(),
          declinedAt: serverTimestamp(),
          declinedBy: user.uid
        });

        // Create moderation log
        const moderationLogRef = collection(db, "moderationLogs");
        await addDoc(moderationLogRef, {
          postId: selectedPost.id,
          action: "declined",
          moderatorId: user.uid,
          reason: declineReason.trim(),
          timestamp: serverTimestamp(),
          postData: {
            userId: selectedPost.userId,
            content: selectedPost.content
          }
        });

        // Create notification for user
        const notificationRef = collection(db, "notifications");
        await addDoc(notificationRef, {
          userId: selectedPost.userId,
          type: "post_declined",
          postId: selectedPost.id,
          reason: declineReason.trim(),
          createdAt: serverTimestamp(),
          read: false,
          moderatorId: user.uid
        });

        toast({
          title: "Post Declined",
          description: "The post has been declined and moved to archive.",
        });
      }

      setShowActionDialog(false);
      setShowDetailsDialog(false);
      setSelectedPost(null);
      setDeclineReason(""); // Reset decline reason
    } catch (error) {
      console.error("Error moderating post:", error);
      toast({
        title: "Error",
        description: "Failed to moderate post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <PageBanner
        title="Reported Posts"
        description="Review and moderate reported posts."
        icon={<FileText className="h-6 w-6 text-white" />} // Example icon
      />

      <Card className="shadow-md border-0 rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Reported Posts Overview</CardTitle>
              <CardDescription>
                {isLoading ? "Loading..." : `${posts.length} posts shown (${allPosts.length} total)`}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 bg-muted/50 border rounded-full focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
               {/* Basic skeleton for list items */}
              {[...Array(postsPerPage)].map((_, i) => (
                <div key={i} className="h-20 w-full bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {/* List of posts */}
              {posts.map(post => (
                // Wrap each post item in a Link
                <div key={post.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium truncate mr-4">{post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {post.reports.length} Reports
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => handleViewDetails(post)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Posted by: {post.userName}</span>
                       <span>{formatDistanceToNow(post.timestamp, { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No reported posts found</h3>
              <p className="text-muted-foreground">Try adjusting your search</p>
            </div>
          )}

           {/* Pagination Controls */}
           <div className="flex justify-center items-center gap-4 mt-6">
             <Button
               variant="outline"
               size="sm"
               onClick={() => setCurrentPage(currentPage - 1)}
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
               onClick={() => setCurrentPage(currentPage + 1)}
               disabled={currentPage === totalPages}
               className="transition-all duration-200"
             >
               Next
               <ChevronRight className="h-4 w-4 ml-2" />
             </Button>
           </div>
        </CardContent>
      </Card>

      {/* Post Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>Review the post and take action</DialogDescription>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-4">
              {/* Post Content */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{selectedPost.content}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Posted by: {selectedPost.userName}</span>
                  <span>{formatDistanceToNow(selectedPost.timestamp, { addSuffix: true })}</span>
                </div>
              </div>

              {/* Post Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{selectedPost.likes}</div>
                  <div className="text-sm text-muted-foreground">Likes</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{selectedPost.comments}</div>
                  <div className="text-sm text-muted-foreground">Comments</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{selectedPost.shares}</div>
                  <div className="text-sm text-muted-foreground">Shares</div>
                </div>
              </div>

              {/* Reports Section */}
              <div className="space-y-2">
                <h4 className="font-medium">Reports ({selectedPost.reports.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedPost.reports.map((report, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {report.reporterAvatar ? (
                            <img 
                              src={report.reporterAvatar} 
                              alt={report.reporterName}
                              className="h-8 w-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = "/placeholder.svg";
                              }}
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {report.reporterName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{report.reporterName}</div>
                          <div className="text-xs text-muted-foreground">
                            Reported {formatDistanceToNow(report.reportedAt, { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="pl-10">
                        <p className="text-sm">{report.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionType("reviewed");
                    setShowActionDialog(true);
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Reviewed
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setActionType("decline");
                    setShowActionDialog(true);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline Post
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "reviewed" ? "Mark as Reviewed" : "Decline Post"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "reviewed"
                ? "Are you sure you want to mark this post as reviewed? It will remain visible to users."
                : "Are you sure you want to decline this post? It will be moved to the user's archive."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "decline" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for declining</label>
              <Textarea
                placeholder="Enter reason for declining the post..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowActionDialog(false);
                setDeclineReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "reviewed" ? "default" : "destructive"}
              onClick={() => handleModeratePost(actionType)}
              disabled={actionType === "decline" && !declineReason.trim()}
            >
              {actionType === "reviewed" ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Reviewed
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 