"use client"

import { useState, useEffect, Suspense } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { SortFilter } from "@/components/ui/sort-filter"
import { PostCard } from "@/components/post/post-card"
import { PostSkeleton } from "@/components/post/post-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  PenSquare,
  Filter,
  RefreshCw,
  EyeOff,
  Archive,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Inbox,
} from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, doc, updateDoc, onSnapshot, getDoc, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"

const filterOptions = [
  { value: "approved", label: "Approved", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  { value: "reviewed", label: "Reviewed", icon: <FileText className="h-4 w-4 text-blue-500" /> },
  { value: "pending", label: "Pending", icon: <Clock className="h-4 w-4 text-yellow-500" /> },
  { value: "declined", label: "Declined", icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
  { value: "hidden", label: "Hidden", icon: <EyeOff className="h-4 w-4 text-purple-500" /> },
]

const sortOptions = [
  { value: "latest", label: "Latest", icon: <Clock className="h-4 w-4" /> },
  { value: "oldest", label: "Oldest", icon: <Clock className="h-4 w-4" /> },
]

export default function MyPostsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyPostsContent />
    </Suspense>
  )
}

function MyPostsContent() {
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [archivedPosts, setArchivedPosts] = useState([])
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [activeFilters, setActiveFilters] = useState([])
  const [sortBy, setSortBy] = useState("latest")
  const [statusCounts, setStatusCounts] = useState({
    approved: 0,
    pending: 0,
    declined: 0,
    hidden: 0,
    total: 0,
  })
  const [activeTab, setActiveTab] = useState("posts")
  const [selectedPost, setSelectedPost] = useState(null)
  const [showHideDialog, setShowHideDialog] = useState(false)
  const [showUnhideDialog, setShowUnhideDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showUnarchiveDialog, setShowUnarchiveDialog] = useState(false)
  const { toast } = useToast()
  const { user, userData, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const postId = searchParams.get("postId")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage, setPostsPerPage] = useState(10)
  const [allPosts, setAllPosts] = useState([])
  const [allArchivedPosts, setAllArchivedPosts] = useState([])

  // UseEffect for setting up Firestore listener
  useEffect(() => {
    // Set loading to true when user or auth state changes, before trying to fetch
    setLoading(true);
    
    let unsubscribePosts = null;

    // Only set up listeners when authentication is complete and user is available
    if (!authLoading && user?.uid) {
      console.log("Setting up posts listener for user:", user.uid);
      const postsRef = collection(db, "posts")
      const q = query(postsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"))

      // Set up real-time listener
      unsubscribePosts = onSnapshot(
        q,
        (snapshot) => {
          console.log("Posts snapshot received. Changes:", snapshot.docChanges().length);
          const fetchedPosts = []
          const fetchedArchivedPosts = []

          snapshot.forEach((doc) => {
            const data = doc.data()
            const timestamp = data.createdAt?.toDate?.() || new Date()

            const postData = {
              id: doc.id,
              ...data,
              timestamp,
              hidden: data.hidden || false,
              user: {
                id: data.userId,
                name: data.isAnonymous ? "Anonymous" : data.userName || userData?.firstName || "User",
                avatar: data.userAvatar || userData?.photoURL || "/abstract-geometric-shapes.png",
              },
            }

            // If post is declined or already archived, move it to archive
            if (data.status === "declined") {
              fetchedArchivedPosts.push(postData);
               // Ensure archived: true is set in Firestore if status is declined and it's not already
               if (!data.archived) {
                  updateDoc(doc.ref, { archived: true }).catch(console.error);
               }
            } else if (data.archived) {
              fetchedArchivedPosts.push(postData)
            } else {
              fetchedPosts.push(postData)
            }
          })

          // Sort posts by timestamp (descending) for consistent order
          fetchedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          fetchedArchivedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          setAllPosts(fetchedPosts)
          setAllArchivedPosts(fetchedArchivedPosts)
          setLoading(false)
          console.log("Posts and archived posts updated.");
        },
        (error) => {
          console.error("Error setting up posts listener:", error)
          setLoading(false)
          toast({
            title: "Error",
            description: "Failed to load your posts. Please try again later.",
            variant: "destructive",
          })
        }
      )
    } else if (!authLoading && !user) {
       // Auth is done loading, and no user is logged in
       console.log("Auth loaded, no user found.");
       setLoading(false);
       setAllPosts([]);
       setAllArchivedPosts([]);
       setPosts([]);
       setArchivedPosts([]);
    }
    // If authLoading is true, the loading state is already set at the start of the effect

    // Cleanup listeners on unmount or when user/authLoading changes
    return () => {
      console.log("Cleaning up posts listener");
      if (unsubscribePosts) {
        unsubscribePosts();
      }
    };
  }, [user?.uid, authLoading]); // Dependencies: Re-run effect if user ID or auth loading state changes

  // Filter posts when postId is provided
  useEffect(() => {
    if (postId) {
      // First check if we're still loading
      if (loading) {
        return; // Wait for loading to complete
      }

      // Search in both active and archived posts
      const specificPost = [...allPosts, ...allArchivedPosts].find(post => post.id === postId);
      
      if (specificPost) {
        // If post is found, show it and switch to appropriate tab
        setPosts([specificPost]);
        if (allArchivedPosts.some(post => post.id === postId)) {
          setActiveTab("archive");
        } else {
          setActiveTab("posts");
        }
      } else {
        // If post is not found in local state, try to fetch it directly
        const fetchSpecificPost = async () => {
          try {
            const postRef = doc(db, "posts", postId);
            const postDoc = await getDoc(postRef);
            
            if (postDoc.exists()) {
              const postData = postDoc.data();
              const post = {
                id: postDoc.id,
                ...postData,
                timestamp: postData.createdAt?.toDate?.() || new Date(),
                hidden: postData.hidden || false,
                user: {
                  id: postData.userId,
                  name: postData.isAnonymous ? "Anonymous" : postData.userName || userData?.firstName || "User",
                  avatar: postData.userAvatar || userData?.photoURL || "/abstract-geometric-shapes.png",
                },
              };

              setPosts([post]);
              if (postData.archived) {
                setActiveTab("archive");
              } else {
                setActiveTab("posts");
              }
            } else {
              setPosts([]);
              toast({
                title: "Post not found",
                description: "The requested post could not be found. It may have been deleted.",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error("Error fetching specific post:", error);
            setPosts([]);
            toast({
              title: "Error",
              description: "Failed to load the post. Please try again later.",
              variant: "destructive",
            });
          }
        };

        fetchSpecificPost();
      }
    } else {
      // If no postId, show all posts
      updatePaginatedPosts();
    }
  }, [postId, allPosts, allArchivedPosts, loading]);

  useEffect(() => {
    // Update status counts whenever allPosts change
    if (allPosts.length > 0) {
      const counts = allPosts.reduce(
        (acc, post) => {
          const status = post.hidden ? "hidden" : post.status
          acc[status] = (acc[status] || 0) + 1
          acc.total += 1
          return acc
        },
        { approved: 0, pending: 0, declined: 0, hidden: 0, total: 0 },
      )

      setStatusCounts(counts)
    }

    // Update paginated posts whenever allPosts or pagination state changes
    updatePaginatedPosts()
  }, [allPosts, currentPage, postsPerPage])

  // Update paginated posts when allPosts or pagination state changes
  const updatePaginatedPosts = () => {
    const startIndex = (currentPage - 1) * postsPerPage
    const endIndex = startIndex + postsPerPage
    setPosts(allPosts.slice(startIndex, endIndex))
  }

  const handleFilterChange = (filters) => {
    setActiveFilters(filters)
  }

  const handleSortChange = (value) => {
    setSortBy(value)
  }

  const getFilteredPosts = () => {
    let filtered = [...posts]

    // Apply filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter((post) => {
        if (post.hidden) return activeFilters.includes("hidden")
        return activeFilters.includes(post.status)
      })
    }

    // Apply sorting
    if (sortBy === "latest") {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    }

    return filtered
  }

  const getStatusBadge = (post) => {
    // If post is hidden, show hidden badge regardless of status
    if (post.hidden) {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <EyeOff className="h-3 w-3 mr-1" /> Hidden
        </Badge>
      )
    }

    // Show status badge
    switch (post.status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        )
      case "declined":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" /> Declined
          </Badge>
        )
      case "reviewed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <FileText className="h-3 w-3 mr-1" /> Reviewed
          </Badge>
        )
      default:
        return null
    }
  }

  const handleHidePost = async () => {
    if (!selectedPost) return

    try {
      const postRef = doc(db, "posts", selectedPost.id)
      await updateDoc(postRef, {
        hidden: true,
      })

      // Update will happen via listener, but update local state for immediate feedback
      setAllPosts(allPosts.map((post) => (post.id === selectedPost.id ? { ...post, hidden: true } : post)))

      toast({
        title: "Post hidden",
        description: "Your post has been hidden from public view",
      })
    } catch (error) {
      console.error("Error hiding post:", error)
      toast({
        title: "Error",
        description: "Failed to hide post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowHideDialog(false)
      setSelectedPost(null)
    }
  }

  const handleUnhidePost = async () => {
    if (!selectedPost) return

    try {
      const postRef = doc(db, "posts", selectedPost.id)
      await updateDoc(postRef, {
        hidden: false,
      })

      // Update will happen via listener, but update local state for immediate feedback
      setAllPosts(allPosts.map((post) => (post.id === selectedPost.id ? { ...post, hidden: false } : post)))

      toast({
        title: "Post unhidden",
        description: "Your post is now visible to the public",
      })
    } catch (error) {
      console.error("Error unhiding post:", error)
      toast({
        title: "Error",
        description: "Failed to unhide post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowUnhideDialog(false)
      setSelectedPost(null)
    }
  }

  const handleArchivePost = async () => {
    if (!selectedPost) return

    try {
      const postRef = doc(db, "posts", selectedPost.id)
      await updateDoc(postRef, {
        archived: true,
      })

      // Update will happen via listener, but update local state for immediate feedback
      const updatedPost = { ...selectedPost, archived: true }
      setAllPosts(allPosts.filter((post) => post.id !== selectedPost.id))
      setAllArchivedPosts([updatedPost, ...allArchivedPosts])

      toast({
        title: "Post archived",
        description: "Your post has been moved to the archive",
      })
    } catch (error) {
      console.error("Error archiving post:", error)
      toast({
        title: "Error",
        description: "Failed to archive post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowArchiveDialog(false)
      setSelectedPost(null)
    }
  }

  const handleUnarchivePost = async () => {
    if (!selectedPost) return

    try {
      const postRef = doc(db, "posts", selectedPost.id)
      await updateDoc(postRef, {
        archived: false,
      })

      // Update will happen via listener, but update local state for immediate feedback
      const updatedPost = { ...selectedPost, archived: false }
      setAllArchivedPosts(allArchivedPosts.filter((post) => post.id !== selectedPost.id))
      setAllPosts([updatedPost, ...allPosts])

      toast({
        title: "Post unarchived",
        description: "Your post has been restored from the archive",
      })
    } catch (error) {
      console.error("Error unarchiving post:", error)
      toast({
        title: "Error",
        description: "Failed to unarchive post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowUnarchiveDialog(false)
      setSelectedPost(null)
    }
  }

  const handleNextPage = () => {
    if (currentPage < Math.ceil(allPosts.length / postsPerPage)) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Loading state check
  const showLoadingSpinner = loading || authLoading; // Show spinner if auth is loading or posts are loading

  // Show auth error if auth is done loading and no user
  const showAuthError = !authLoading && !user && !showLoadingSpinner;

  // Add a function to clear the post filter
  const clearPostFilter = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('postId');
    window.history.pushState({}, '', url);
    updatePaginatedPosts();
  };

  const fetchUserPosts = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Create a query to get the user's posts - both approved and reviewed posts
      const postsQuery = query(
        collection(db, "posts"),
        where("userId", "==", user.uid),
        where("status", "in", ["approved", "reviewed"]),
        where("isAnonymous", "==", false), // Only fetch non-anonymous posts
        orderBy("createdAt", "desc"),
        limit(10),
      )

      // Try the first query
      try {
        const querySnapshot = await getDocs(postsQuery)
        const fetchedPosts = []

        querySnapshot.forEach((doc) => {
          fetchedPosts.push({
            id: doc.id,
            ...doc.data(),
          })
        })

        console.log("Fetched posts:", fetchedPosts)
        setPosts(fetchedPosts)
      } catch (error) {
        console.error("Error with first query:", error)

        // Try alternative query with different field structure
        try {
          const alternativeQuery = query(
            collection(db, "posts"),
            where("user.id", "==", user.uid),
            where("status", "in", ["approved", "reviewed"]),
            where("isAnonymous", "==", false), // Only fetch non-anonymous posts
            orderBy("timestamp", "desc"),
            limit(10),
          )

          const altQuerySnapshot = await getDocs(alternativeQuery)
          const altFetchedPosts = []

          altQuerySnapshot.forEach((doc) => {
            altFetchedPosts.push({
              id: doc.id,
              ...doc.data(),
            })
          })

          console.log("Fetched posts (alternative):", altFetchedPosts)
          setPosts(altFetchedPosts)
        } catch (altError) {
          console.error("Error with alternative query:", altError)

          // Final attempt with minimal filters
          try {
            const simpleQuery = query(collection(db, "posts"), where("userId", "==", user.uid), limit(10))

            const simpleQuerySnapshot = await getDocs(simpleQuery)
            const simpleFetchedPosts = []

            simpleQuerySnapshot.forEach((doc) => {
              const postData = doc.data()
              // Only include approved, reviewed and non-anonymous posts
              if ((postData.status === "approved" || postData.status === "reviewed") && postData.isAnonymous === false) {
                simpleFetchedPosts.push({
                  id: doc.id,
                  ...postData,
                })
              }
            })

            console.log("Fetched posts (simple):", simpleFetchedPosts)
            setPosts(simpleFetchedPosts)
          } catch (simpleError) {
            console.error("Error with simple query:", simpleError)
            setPosts([])
          }
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      })
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <PageBanner title="My Posts" description="Manage and track all your posts in one place." />

      <div className="max-w-3xl mx-auto">
        <Card className="mb-6 animate-in rounded-xl shadow-md border-0">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <CardTitle className="text-xl font-bold">Post Management</CardTitle>
              {postId && (
                <Button variant="outline" size="sm" onClick={clearPostFilter} className="rounded-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Show All Posts
                </Button>
              )}
              {user ? (
                <Button className="rounded-full shadow-sm" asChild>
                  <Link href="/user/create">
                    <PenSquare className="h-4 w-4 mr-2" />
                    Create New Post
                  </Link>
                </Button>
              ) : (
                !showAuthError && !showLoadingSpinner && (
                   <Button className="rounded-full shadow-sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Page
                  </Button>
                )
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showAuthError ? (
              <div className="text-center py-12 bg-red-50 rounded-xl">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-red-700 font-medium mb-2">Authentication Error</p>
                <p className="text-red-600 mb-4">
                  You must be logged in to view your posts. Your session may have expired.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button className="rounded-full shadow-sm" asChild>
                    <Link href="/login">Log In Again</Link>
                  </Button>
                  <Button variant="outline" className="rounded-full shadow-sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Page
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <Tabs defaultValue="posts" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-2 h-14 p-1 bg-muted/50 rounded-xl">
                      <TabsTrigger
                        value="posts"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm h-12"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">My Posts</span>
                        {allPosts.length > 0 && (
                          <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary">
                            {allPosts.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="archive"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm h-12"
                      >
                        <Archive className="h-4 w-4" />
                        <span className="font-medium">Archive</span>
                        {allArchivedPosts.length > 0 && (
                          <Badge variant="secondary" className="ml-1 bg-muted text-muted-foreground">
                            {allArchivedPosts.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="mt-6 space-y-4">
                      {/* Posts content */}
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {showLoadingSpinner ? (
                              <span>Loading posts...</span>
                            ) : (
                              <span>
                                {getFilteredPosts().length} {getFilteredPosts().length === 1 ? "post" : "posts"}
                                {allPosts.length > 0 ? ` (${allPosts.length} total)` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <SortFilter
                            sortOptions={sortOptions}
                            onSortChange={handleSortChange}
                          />
                          <div className="flex flex-wrap gap-2">
                            {filterOptions.map((option) => (
                              <Button
                                key={option.value}
                                variant={activeFilters.includes(option.value) ? "default" : "outline"}
                                size="sm"
                                className="rounded-full"
                                onClick={() => {
                                  if (activeFilters.includes(option.value)) {
                                    setActiveFilters(activeFilters.filter(f => f !== option.value))
                                  } else {
                                    setActiveFilters([...activeFilters, option.value])
                                  }
                                }}
                              >
                                {option.icon}
                                <span className="ml-2">{option.label}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {showLoadingSpinner ? (
                        <>
                          <PostSkeleton />
                          <PostSkeleton />
                        </>
                      ) : getFilteredPosts().length > 0 ? (
                        <>
                          {getFilteredPosts().map((post) => (
                            <div key={post.id} className="mb-6">
                              <div className="flex justify-between items-center mb-2">
                                <div>{getStatusBadge(post)}</div>
                                <div className="flex gap-2">
                                  {post.status === "approved" && (
                                    <>
                                      {post.hidden ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="rounded-full"
                                          onClick={() => {
                                            setSelectedPost(post)
                                            setShowUnhideDialog(true)
                                          }}
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          Unhide
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="rounded-full"
                                          onClick={() => {
                                            setSelectedPost(post)
                                            setShowHideDialog(true)
                                          }}
                                        >
                                          <EyeOff className="h-3 w-3 mr-1" />
                                          Hide
                                        </Button>
                                      )}
                                    </>
                                  )}

                                  {post.status === "declined" && ( // Show feedback button for declined posts in main list too
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-full"
                                      onClick={() => setSelectedFeedback(post.feedback)}
                                    >
                                      View Feedback
                                    </Button>
                                  )}

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => {
                                      setSelectedPost(post)
                                      setShowArchiveDialog(true)
                                    }}
                                  >
                                    <Archive className="h-3 w-3 mr-1" />
                                    Archive
                                  </Button>
                                </div>
                              </div>
                              <PostCard post={post} />
                            </div>
                          ))}

                          {/* Pagination Controls */}
                          {allPosts.length > postsPerPage && (
                            <div className="flex justify-between items-center mt-6">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="rounded-full"
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Page {currentPage} of {Math.ceil(allPosts.length / postsPerPage)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage >= Math.ceil(allPosts.length / postsPerPage)}
                                className="rounded-full"
                              >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12 bg-muted/30 rounded-xl">
                          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-muted-foreground" />{/* Changed icon to reflect no posts */}
                          </div>
                          <p className="text-muted-foreground mb-4">You haven't created any posts yet</p>
                          <Button className="rounded-full shadow-sm" asChild>
                            <Link href="/user/create">
                              <PenSquare className="h-4 w-4 mr-2" />
                              Create Your First Post
                            </Link>
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="archive" className="mt-6">
                      {/* Archive content */}
                      {allArchivedPosts.length > 0 ? (
                        <>
                          <div className="mb-4 p-4 bg-muted/20 rounded-lg">
                            <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                              <Inbox className="h-5 w-5 text-muted-foreground" />
                              Archived Posts
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              These posts are not visible to others and don't appear in your profile.
                            </p>
                          </div>

                          {allArchivedPosts.map((post) => (
                            <div key={post.id} className="mb-6">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="bg-gray-100 text-gray-700 border-border">
                                    <Archive className="h-3 w-3 mr-1" /> Archived
                                  </Badge>
                                  {post.status === "declined" && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                      <AlertCircle className="h-3 w-3 mr-1" /> Declined
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {post.status === "declined" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-full"
                                      onClick={() => setSelectedFeedback(post.feedback)}
                                    >
                                      View Feedback
                                    </Button>
                                  )}
                                  {/* Removed Edit & Resubmit button from Archive */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => {
                                      setSelectedPost(post)
                                      setShowUnarchiveDialog(true)
                                    }}
                                  >
                                    Unarchive
                                  </Button>
                                </div>
                              </div>
                              <PostCard post={post} />
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="text-center py-12 bg-muted/30 rounded-xl">
                          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Archive className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground mb-2">No archived posts</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Declined posts and posts you archive will appear here.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Feedback Dialog */}
        <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
          <DialogContent className="sm:max-w-md animate-in rounded-xl">
            <DialogHeader>
              <DialogTitle>Moderator Feedback</DialogTitle>
              <DialogDescription>Here's why your post was declined</DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-muted rounded-lg text-sm">{selectedFeedback}</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setSelectedFeedback(null)}>
                Close
              </Button>
              <span className="text-muted-foreground text-xs mt-2 block">View Content Rules (coming soon)</span>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hide Post Dialog */}
        <Dialog open={showHideDialog} onOpenChange={setShowHideDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Hide Post</DialogTitle>
              <DialogDescription>
                Hidden posts won't appear in feeds or your profile, but they're not deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to hide this post?</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHideDialog(false)} className="rounded-full">
                Cancel
              </Button>
              <Button onClick={handleHidePost} className="rounded-full">
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unhide Post Dialog */}
        <Dialog open={showUnhideDialog} onOpenChange={setShowUnhideDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Unhide Post</DialogTitle>
              <DialogDescription>This will make your post visible in feeds and your profile again.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to unhide this post?</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUnhideDialog(false)} className="rounded-full">
                Cancel
              </Button>
              <Button onClick={handleUnhidePost} className="rounded-full">
                <Eye className="h-4 w-4 mr-2" />
                Unhide Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive Post Dialog */}
        <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Archive Post</DialogTitle>
              <DialogDescription>
                Archived posts are removed from your main posts list but can be restored later.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to archive this post?</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowArchiveDialog(false)} className="rounded-full">
                Cancel
              </Button>
              <Button onClick={handleArchivePost} className="rounded-full">
                <Archive className="h-4 w-4 mr-2" />
                Archive Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unarchive Post Dialog */}
        <Dialog open={showUnarchiveDialog} onOpenChange={setShowUnarchiveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Unarchive Post</DialogTitle>
              <DialogDescription>This will restore your post to your main posts list.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to unarchive this post?</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUnarchiveDialog(false)} className="rounded-full">
                Cancel
              </Button>
              <Button onClick={handleUnarchivePost} className="rounded-full">
                <Archive className="h-4 w-4 mr-2" />
                Unarchive Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
