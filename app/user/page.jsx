"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { SortFilter } from "@/components/ui/sort-filter"
import { PostCard } from "@/components/post/post-card"
import { PostSkeleton } from "@/components/post/post-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PenSquare, TrendingUp, ThumbsUp, Clock, Check, FileText } from "lucide-react"
import Link from "next/link"
import { User, Bell } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore"
import { CreatePostForm } from "@/components/post/create-post-form"

const sortOptions = [
  { value: "latest", label: "Latest", icon: <Clock className="h-4 w-4" /> },
  { value: "popular", label: "Most Liked", icon: <ThumbsUp className="h-4 w-4" /> },
  { value: "trending", label: "Trending", icon: <TrendingUp className="h-4 w-4" /> },
]

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [sortBy, setSortBy] = useState("latest")

  useEffect(() => {
    fetchPosts()
  }, [sortBy])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      // Fetch both approved and reviewed posts
      let postsQuery = query(
        collection(db, "posts"),
        where("status", "in", ["approved", "reviewed"]),
        limit(20)
      )

      // Apply sorting
      switch (sortBy) {
        case "latest":
          postsQuery = query(postsQuery, orderBy("createdAt", "desc"))
          break
        case "popular":
          postsQuery = query(postsQuery, orderBy("likes", "desc"))
          break
        case "trending":
          // For trending, we'll use a combination of recency and popularity
          postsQuery = query(postsQuery, orderBy("createdAt", "desc"))
          break
        default:
          postsQuery = query(postsQuery, orderBy("createdAt", "desc"))
      }

      const querySnapshot = await getDocs(postsQuery)
      const fetchedPosts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to ISO string for easier handling
        timestamp: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
        // Ensure user data is properly structured
        user: {
          id: doc.data().userId || "anonymous",
          name: doc.data().userName || "Anonymous User",
          avatar: doc.data().userAvatar || null,
        },
      }))

      setPosts(fetchedPosts)
    } catch (error) {
      console.error("Error fetching posts:", error)
      // If there's an error, show mock data as fallback
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (value) => {
    setSortBy(value)
  }

  return (
    <PageLayout>
      <PageBanner
        title="Welcome to MBC Connect"
        description="Share your thoughts, connect with others, and build a supportive community."
        size="lg"
      >
        <Button className="mt-4 bg-white text-primary hover:bg-white/90 shadow-md rounded-full" asChild>
          <Link href="/user/create">
            <PenSquare className="h-4 w-4 mr-2" />
            Create Post
          </Link>
        </Button>
      </PageBanner>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <CreatePostForm onPostCreated={fetchPosts} />

          <Card className="overflow-hidden rounded-xl shadow-md border-0">
            <CardHeader className="p-4 pb-0">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <CardTitle className="text-xl font-bold">Community Feed</CardTitle>
                <SortFilter sortOptions={sortOptions} onSortChange={handleSortChange} />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <>
                  <PostSkeleton />
                  <PostSkeleton />
                </>
              ) : posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No posts found. Be the first to create a post!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-xl shadow-md border-0">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Button className="w-full justify-start rounded-lg shadow-sm" variant="outline" asChild>
                  <Link href="/user/create">
                    <PenSquare className="h-4 w-4 mr-2 text-primary" />
                    Create New Post
                  </Link>
                </Button>
                <Button className="w-full justify-start rounded-lg shadow-sm" variant="outline" asChild>
                  <Link href="/user/my-posts">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    View My Posts
                  </Link>
                </Button>
                <Button className="w-full justify-start rounded-lg shadow-sm" variant="outline" asChild>
                  <Link href="/user/notifications">
                    <Bell className="h-4 w-4 mr-2 text-primary" />
                    Check Notifications
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-md border-0">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xl font-bold">Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Be respectful and kind to others</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>No hate speech or bullying</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Respect privacy and confidentiality</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Posts are subject to admin review</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-4 rounded-full" 
                variant="outline"
                asChild
              >
                <Link href="/user/settings?tab=content">
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Guidelines
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
