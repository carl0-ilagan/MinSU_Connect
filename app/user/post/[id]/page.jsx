"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { PostCard } from "@/components/post/post-card"
import { PostSkeleton } from "@/components/post/post-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock data
const mockPosts = [
  {
    id: "1",
    user: {
      id: "user1",
      name: "Jane Smith",
      avatar: "/diverse-woman-portrait.png",
    },
    content:
      "Just finished my latest project! So excited to share it with everyone. What do you think? #creativity #project",
    image: "/project-management-team.png",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    likes: 3,
    comments: 5,
    commentList: [
      {
        user: {
          id: "user2",
          name: "John Doe",
          avatar: "/thoughtful-man.png",
        },
        content: "This looks amazing! Great work!",
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 minutes ago
      },
      {
        user: {
          id: "user3",
          name: "Sarah Johnson",
          avatar: "/woman-with-glasses.png",
        },
        content: "I love the colors you used. Very inspiring!",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
      },
    ],
    reactions: {
      "user2": "love",
      "user3": "like",
      "user4": "haha",
    },
    likedBy: ["user2", "user3", "user4"],
  },
  {
    id: "2",
    user: {
      id: "user4",
      name: "Michael Brown",
      avatar: "/bearded-man-portrait.png",
    },
    content:
      "Had an amazing time at the community meetup yesterday. Met so many wonderful people and learned a lot. Looking forward to the next one!",
    image: "/community-meetup.png",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    likes: 1,
    comments: 8,
    commentList: [
      {
        user: {
          id: "user5",
          name: "Emily Wilson",
          avatar: "/red-haired-woman.png",
        },
        content: "It was great meeting you there! Let's connect soon.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      },
    ],
    reactions: {
      "user5": "like",
    },
    likedBy: ["user5"],
  },
]

export default function SinglePostPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState(null)
  const [commentText, setCommentText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Simulate fetching post data
    const timer = setTimeout(() => {
      const foundPost = mockPosts.find((p) => p.id === params.id)

      if (foundPost) {
        setPost(foundPost)
        setLoading(false) // Set loading to false only after setting post
      } else {
        toast({
          title: "Error",
          description: "Post not found",
          variant: "destructive",
        })
        router.push("/user")
        setLoading(false) // Also set loading to false if post not found
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [params.id, router, toast])

  const handleCommentSubmit = (e) => {
    e.preventDefault()

    if (!commentText.trim()) return

    setSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      const newComment = {
        user: {
          id: 1,
          name: "You",
          avatar: "/abstract-geometric-shapes.png",
        },
        content: commentText,
        timestamp: new Date().toISOString(),
      }

      setPost((prev) => ({
        ...prev,
        commentList: [newComment, ...prev.commentList],
        comments: prev.comments + 1,
      }))

      setCommentText("")
      setSubmitting(false)

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      })
    }, 1000)
  }

  return (
    <PageLayout>
      {loading ? (
        <>
          <PageBanner title="Loading Post..." description="Please wait while we fetch the post details." />
          <div className="max-w-3xl mx-auto">
            <PostSkeleton />
          </div>
        </>
      ) : (
        <>
          {post && post.user && (
            <PageBanner title={`${post.user.name}'s Post`} description="View and interact with this post.">
              <Button className="mt-4 bg-white text-primary hover:bg-white/90" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </PageBanner>
          )}

          {post && (
            <div className="max-w-3xl mx-auto space-y-6">
              <PostCard post={post} />

              <Card>
                <CardContent className="p-4">
                  <form onSubmit={handleCommentSubmit} className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/abstract-geometric-shapes.png" alt="Your avatar" />
                      <AvatarFallback>YA</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button type="submit" disabled={!commentText.trim() || submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          "Post Comment"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
