"use client"

import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Loader2, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PrivacySettingsPage() {
  const [allowAnonymous, setAllowAnonymous] = useState(true)
  const [showProfileToAll, setShowProfileToAll] = useState(true)
  const [allowComments, setAllowComments] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Privacy settings updated",
        description: "Your privacy settings have been updated successfully.",
      })
    }, 1500)
  }

  return (
    <PageLayout>
      <PageBanner
        title="Privacy Settings"
        description="Control your privacy and visibility on MBC Connect."
        icon={<Shield className="h-6 w-6 text-white" />}
      />

      <SettingsLayout activeTab="privacy">
        <Card>
          <CardHeader>
            <CardTitle>Privacy Controls</CardTitle>
            <CardDescription>Manage how your information is shared and displayed</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymous-posting">Anonymous Posting</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow yourself to post anonymously when creating content
                  </p>
                </div>
                <Switch id="anonymous-posting" checked={allowAnonymous} onCheckedChange={setAllowAnonymous} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">Make your profile visible to all community members</p>
                </div>
                <Switch id="profile-visibility" checked={showProfileToAll} onCheckedChange={setShowProfileToAll} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-comments">Allow Comments</Label>
                  <p className="text-sm text-muted-foreground">Allow other users to comment on your posts</p>
                </div>
                <Switch id="allow-comments" checked={allowComments} onCheckedChange={setAllowComments} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </SettingsLayout>
    </PageLayout>
  )
}
