"use client"

import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useState } from "react"
import { Loader2, HelpCircle, Mail, MessageSquare, FileText, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function HelpSupportPage() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSubject("")
      setMessage("")
      toast({
        title: "Support request sent",
        description: "We've received your message and will respond shortly.",
      })
    }, 1500)
  }

  return (
    <PageLayout>
      <PageBanner
        title="Help & Support"
        description="Get help with using MBC Connect and find answers to common questions."
      >
        <div className="flex items-center mt-4 bg-white/20 p-2 rounded-lg max-w-fit">
          <HelpCircle className="h-5 w-5 mr-2 text-white" />
          <span className="text-white text-sm">We're here to help you</span>
        </div>
      </PageBanner>

      <SettingsLayout activeTab="help">
        <div className="space-y-6">
          <Card className="rounded-xl shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Frequently Asked Questions</CardTitle>
              <CardDescription>Find answers to common questions about using MBC Connect</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left font-medium">How do I create a post?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    To create a post, click on the "Create Post" button on the home page or in the navigation menu. Fill
                    in your post content, add any images if desired, and click "Submit for Approval". Your post will be
                    reviewed by our moderators before being published to the community.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left font-medium">
                    Why do posts need to be approved?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We review all posts to ensure they follow our community guidelines and provide a safe, supportive
                    environment for all members. This process typically takes 24-48 hours. You'll receive a notification
                    once your post is approved or if it requires revisions.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left font-medium">
                    How do I update my profile information?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Go to Settings &gt; Account Settings to update your profile information including your name, email,
                    and bio. You can also update your profile picture by clicking on it in the profile page.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left font-medium">
                    How do I change my privacy settings?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Go to Settings &gt; Privacy to control your privacy settings. You can manage who can see your
                    profile, whether you want to post anonymously, and who can comment on your posts.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left font-medium">
                    What should I do if I see inappropriate content?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    If you see content that violates our community guidelines, please report it immediately. Click the
                    three dots menu on the post and select "Report Post". Our moderation team will review the report and
                    take appropriate action.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-xl shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Contact Support</CardTitle>
                <CardDescription>Send us a message and we'll get back to you as soon as possible</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      placeholder="What do you need help with?"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Please describe your issue in detail"
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
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Resources</CardTitle>
                <CardDescription>Helpful resources and additional support options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4 flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">User Guide</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Comprehensive guide to using all features of MBC Connect
                    </p>
                    <Button variant="outline" size="sm" className="rounded-full" asChild>
                      <Link href="#">
                        View Guide
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4 flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Community Forum</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Connect with other users and share tips and experiences
                    </p>
                    <Button variant="outline" size="sm" className="rounded-full" asChild>
                      <Link href="#">
                        Visit Forum
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4 flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Email Support</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      For urgent issues, email our support team directly
                    </p>
                    <Button variant="outline" size="sm" className="rounded-full" asChild>
                      <Link href="mailto:support@mbcconnect.com">support@mbcconnect.com</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SettingsLayout>
    </PageLayout>
  )
}
