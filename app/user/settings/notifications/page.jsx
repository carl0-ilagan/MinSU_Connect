"use client"

import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Loader2, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsSettingsPage() {
  const [likesNotifications, setLikesNotifications] = useState(true)
  const [commentsNotifications, setCommentsNotifications] = useState(true)
  const [postApprovalNotifications, setPostApprovalNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been updated successfully.",
      })
    }, 1500)
  }

  return (
    <PageLayout>
      <PageBanner
        title="Notification Settings"
        description="Control what notifications you receive and how they are delivered."
      >
        <div className="flex items-center mt-4 bg-white/20 p-2 rounded-lg max-w-fit">
          <Bell className="h-5 w-5 mr-2 text-white" />
          <span className="text-white text-sm">Stay updated with what matters to you</span>
        </div>
      </PageBanner>

      <SettingsLayout activeTab="notifications">
        <Card className="rounded-xl shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Notification Preferences</CardTitle>
            <CardDescription>Choose what types of notifications you want to receive</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Activity Notifications</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="likes-notifications">Likes</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications when someone likes your post</p>
                  </div>
                  <Switch
                    id="likes-notifications"
                    checked={likesNotifications}
                    onCheckedChange={setLikesNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="comments-notifications">Comments</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when someone comments on your post
                    </p>
                  </div>
                  <Switch
                    id="comments-notifications"
                    checked={commentsNotifications}
                    onCheckedChange={setCommentsNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="approval-notifications">Post Approvals</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about your post approval status
                    </p>
                  </div>
                  <Switch
                    id="approval-notifications"
                    checked={postApprovalNotifications}
                    onCheckedChange={setPostApprovalNotifications}
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <h3 className="text-lg font-semibold">Delivery Methods</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                  </div>
                  <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="rounded-full" disabled={isSubmitting}>
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
