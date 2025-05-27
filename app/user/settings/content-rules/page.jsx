"use client"

import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Shield, Check } from "lucide-react"

export default function ContentRulesSettingsPage() {
  const [agreed, setAgreed] = useState(true)
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
        title="Content Rules"
        description="Our community guidelines to ensure a safe and supportive environment."
      >
        <div className="flex items-center mt-4 bg-white/20 p-2 rounded-lg max-w-fit">
          <Shield className="h-5 w-5 mr-2 text-white" />
          <span className="text-white text-sm">These guidelines help keep our community safe</span>
        </div>
      </PageBanner>

      <SettingsLayout activeTab="content-rules">
        <Card className="rounded-xl shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Community Guidelines</CardTitle>
            <CardDescription>Please read and agree to our community guidelines before posting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">Respectful Communication</h3>
              <p className="text-muted-foreground mb-4">
                We're committed to providing a safe and supportive environment for all members. Please communicate with
                respect and empathy.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Be kind and courteous to other community members</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Avoid personal attacks, insults, or derogatory language</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Consider how your words might affect others before posting</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Respect different opinions and perspectives</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Prohibited Content</h3>
              <p className="text-muted-foreground mb-4">
                The following types of content are not allowed on MBC Connect:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Hate speech, discrimination, or content that promotes violence</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Sexually explicit or pornographic material</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Content that harasses, bullies, or intimidates others</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Spam, scams, or misleading information</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Content that violates others' privacy or intellectual property rights</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Unverified medical claims or dangerous health advice</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Moderation Process</h3>
              <p className="text-muted-foreground mb-4">
                To maintain a safe environment, all posts are subject to review by our moderation team:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>All posts are reviewed before being published to the community</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Posts that violate our guidelines will be declined with feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Repeated violations may result in temporary or permanent account restrictions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>You can edit and resubmit declined posts after addressing the feedback</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Privacy Considerations</h3>
              <p className="text-muted-foreground mb-4">Respect the privacy of yourself and others:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Don't share personal identifying information of others without consent</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Consider using the anonymous posting option for sensitive topics</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span>Be mindful of what personal information you share about yourself</span>
                </li>
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

            <Button onClick={handleAgree} disabled={!agreed} className="w-full rounded-full">
              Confirm Agreement
            </Button>
          </CardContent>
        </Card>
      </SettingsLayout>
    </PageLayout>
  )
}
