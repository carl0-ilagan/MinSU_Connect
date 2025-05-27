"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { FileImage, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock data
const mockPosts = [
  {
    id: "1",
    content:
      "Just finished my latest project! So excited to share it with everyone. What do you think? #creativity #project",
    image: "/project-management-team.png",
    isAnonymous: false,
  },
  {
    id: "2",
    content: "Has anyone tried this new meditation technique? I'm curious about your experiences.",
    image: null,
    isAnonymous: false,
  },
  {
    id: "3",
    content: "Check out this inappropriate content that violates community guidelines.",
    image: null,
    isAnonymous: true,
  },
]

export default function EditPostPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    // Simulate fetching post data
    const timer = setTimeout(() => {
      const post = mockPosts.find((p) => p.id === params.id)

      if (post) {
        setContent(post.content)
        setIsAnonymous(post.isAnonymous)
        if (post.image) {
          setPreviewUrl(post.image)
        }
      } else {
        toast({
          title: "Error",
          description: "Post not found",
          variant: "destructive",
        })
        router.push("/user/my-posts")
      }

      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [params.id, router, toast])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!content.trim() && !previewUrl) {
      toast({
        title: "Error",
        description: "Please add some content or an image to your post.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setSubmitting(false)
      toast({
        title: "Success",
        description: "Your post has been updated and resubmitted for approval.",
      })
      router.push("/user/my-posts")
    }, 1500)
  }

  if (loading) {
    return (
      <PageLayout>
        <PageBanner title="Edit Post" description="Update your post and resubmit for approval." />
        <div className="max-w-2xl mx-auto flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageBanner title="Edit Post" description="Update your post and resubmit for approval." />

      <div className="max-w-2xl mx-auto">
        <Card className="mb-6 animate-in">
          <CardHeader>
            <CardTitle>Edit and Resubmit</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarImage src="/abstract-geometric-shapes.png" alt="Your avatar" />
                  <AvatarFallback>YA</AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              {previewUrl && (
                <div className="relative mt-2 rounded-md overflow-hidden border">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="max-h-[300px] w-full object-contain bg-black/5"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch id="anonymous-mode" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                  <Label htmlFor="anonymous-mode">Post anonymously</Label>
                </div>

                <div>
                  <Button type="button" variant="outline" size="sm" className="mr-2" asChild>
                    <label>
                      <FileImage className="h-4 w-4 mr-2" />
                      {previewUrl ? "Change Image" : "Add Image"}
                      <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/user/my-posts")}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resubmitting
                  </>
                ) : (
                  "Resubmit for Approval"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </PageLayout>
  )
}
