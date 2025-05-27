"use client"

import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Shield } from "lucide-react"

export default function ContentRulesPage() {
  const [agreed, setAgreed] = useState(false)
  const { toast } = useToast()

  const handleAgree = () => {
    if (agreed) {
      toast({
        title: "Agreement Confirmed",
        description: "Thank you for agreeing to our community guidelines.",
      })
    }
  }

  return (
    <PageLayout>
      <PageBanner
        title="Community Guidelines"
        description="Our rules and standards to ensure a safe and supportive environment for all members."
        size="lg"
      >
        <div className="flex items-center mt-4 bg-white/20 p-2 rounded-lg max-w-fit">
          <Shield className="h-5 w-5 mr-2 text-white" />
          <span className="text-white text-sm">These guidelines help keep our community safe</span>
        </div>
      </PageBanner>

      <div className="max-w-3xl mx-auto">
        <Card className="mb-6 animate-in">
          <CardHeader>
            <CardTitle>Community Guidelines</CardTitle>
            <CardDescription>Please read and agree to our community guidelines before posting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">Respectful Communication</h3>
              <p className="text-muted-foreground mb-4">
                We're committed to providing a safe and supportive environment for all members. Please communicate with
                respect and empathy.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Be kind and courteous to other community members</li>
                <li>Avoid personal attacks, insults, or derogatory language</li>
                <li>Consider how your words might affect others before posting</li>
                <li>Respect different opinions and perspectives</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Prohibited Content</h3>
              <p className="text-muted-foreground mb-4">
                The following types of content are not allowed on MBC Connect:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Hate speech, discrimination, or content that promotes violence</li>
                <li>Sexually explicit or pornographic material</li>
                <li>Content that harasses, bullies, or intimidates others</li>
                <li>Spam, scams, or misleading information</li>
                <li>Content that violates others' privacy or intellectual property rights</li>
                <li>Unverified medical claims or dangerous health advice</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Moderation Process</h3>
              <p className="text-muted-foreground mb-4">
                To maintain a safe environment, all posts are subject to review by our moderation team:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>All posts are reviewed before being published to the community</li>
                <li>Posts that violate our guidelines will be declined with feedback</li>
                <li>Repeated violations may result in temporary or permanent account restrictions</li>
                <li>You can edit and resubmit declined posts after addressing the feedback</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Privacy Considerations</h3>
              <p className="text-muted-foreground mb-4">Respect the privacy of yourself and others:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Don't share personal identifying information of others without consent</li>
                <li>Consider using the anonymous posting option for sensitive topics</li>
                <li>Be mindful of what personal information you share about yourself</li>
              </ul>
            </section>

            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and agree to the community guidelines
              </label>
            </div>

            <Button onClick={handleAgree} disabled={!agreed} className="w-full">
              Confirm Agreement
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
