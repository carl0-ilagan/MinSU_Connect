"use client"

import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { CreatePostForm } from "@/components/post/create-post-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function CreatePostPage() {
  return (
    <PageLayout>
      <PageBanner
        title="Create a New Post"
        description="Share your thoughts, experiences, and questions with the community."
      />

      <div className="max-w-2xl mx-auto">
        <Alert className="mb-6 animate-in">
          <Info className="h-4 w-4" />
          <AlertTitle>Post Moderation</AlertTitle>
          <AlertDescription>
            All posts are reviewed by our moderators before being published to ensure they follow our community
            guidelines.
          </AlertDescription>
        </Alert>

        <CreatePostForm />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Content Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">What to Share</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>Personal experiences and stories</li>
                <li>Questions and requests for advice</li>
                <li>Helpful resources and information</li>
                <li>Supportive messages and encouragement</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-1">What Not to Share</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>Hate speech, bullying, or harassment</li>
                <li>Explicit or inappropriate content</li>
                <li>Spam or promotional content</li>
                <li>Misinformation or unverified medical claims</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
