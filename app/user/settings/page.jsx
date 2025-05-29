"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Lock, MailCheck, Clock, Monitor, Smartphone, Globe, AlertCircle, Shield, FileText, HelpCircle, Users, MessageSquare, Headphones } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { sendPasswordResetEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [sessionInfo, setSessionInfo] = useState(null)
  const [activeTab, setActiveTab] = useState("security")

  // Get the tab parameter from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const tab = searchParams.get('tab')
    if (tab === 'content') {
      setActiveTab('content')
    }
  }, [])

  // Get device information
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent)
    const isChrome = /Chrome/i.test(userAgent)
    const isFirefox = /Firefox/i.test(userAgent)
    const isSafari = /Safari/i.test(userAgent)
    const isEdge = /Edg/i.test(userAgent)

    let browser = "Unknown Browser"
    if (isChrome) browser = "Chrome"
    else if (isFirefox) browser = "Firefox"
    else if (isSafari) browser = "Safari"
    else if (isEdge) browser = "Edge"

    return {
      isMobile,
      browser,
      userAgent
    }
  }

  // Update session info when component mounts
  useEffect(() => {
    const updateSessionInfo = async () => {
      if (user) {
        const deviceInfo = getDeviceInfo()
        const userRef = doc(db, "users", user.uid)
        
        try {
          // Update session info in Firestore
          await updateDoc(userRef, {
            lastSession: {
              timestamp: serverTimestamp(),
              device: deviceInfo.isMobile ? "Mobile" : "Desktop",
              browser: deviceInfo.browser,
              userAgent: deviceInfo.userAgent
            }
          })

          // Get updated user data
          const userDoc = await getDoc(userRef)
          if (userDoc.exists()) {
            setSessionInfo(userDoc.data().lastSession)
          }
        } catch (error) {
          console.error("Error updating session info:", error)
        }
      }
    }

    updateSessionInfo()
  }, [user])

  // Password update handler
  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (!user) return
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "All fields required", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" })
      return
    }
    setIsUpdating(true)
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      toast({ title: "Password updated successfully" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({ title: "Error updating password", description: error.message, variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  // Forgot password handler
  const handleSendReset = async () => {
    if (!user?.email) {
      toast({ title: "No email found for this account", variant: "destructive" })
      return
    }
    setIsSendingReset(true)
    try {
      await sendPasswordResetEmail(user.auth, user.email)
      toast({ title: "Reset email sent", description: `Check your email (${user.email}) for reset instructions.` })
    } catch (error) {
      toast({ title: "Error sending reset email", description: error.message, variant: "destructive" })
    } finally {
      setIsSendingReset(false)
    }
  }

  // Session log (last login info)
  const lastLogin = user?.metadata?.lastSignInTime
  const creationTime = user?.metadata?.creationTime
  const email = user?.email

  // Get device icon based on device type
  const getDeviceIcon = (device) => {
    switch (device) {
      case "Mobile":
        return <Smartphone className="h-4 w-4 text-blue-500" />
      case "Desktop":
        return <Monitor className="h-4 w-4 text-green-500" />
      default:
        return <Globe className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <PageLayout>
      <PageBanner
        title="Account Settings"
        description="Manage your account security, content rules, and get help"
        icon={<Shield className="h-6 w-6 text-white" />}
      >
        <div className="flex items-center mt-4 bg-white/20 p-2 rounded-lg max-w-fit">
          <Shield className="h-5 w-5 mr-2 text-white" />
          <span className="text-white text-sm">Keep your account secure and up to date</span>
        </div>
      </PageBanner>

      <div className="max-w-6xl mx-auto py-10 w-full px-2 sm:px-4 overflow-x-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content Rules
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Help
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Left Column - Change Password */}
              <div className="h-full">
                <Card className="rounded-xl shadow-md border-0 h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="bg-green-100 p-2 rounded-full"><Lock className="h-5 w-5 text-green-700" /></div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </div>
          </CardHeader>
                  <form onSubmit={handlePasswordUpdate} className="flex flex-col flex-grow">
                    <CardContent className="space-y-3 flex-grow">
                      <div className="space-y-1.5">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              </div>
                      <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
                      <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>

                      {/* Security Tips */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="font-medium text-blue-800 mb-1.5 flex items-center gap-2 text-sm">
                          <Shield className="h-4 w-4" />
                          Password Security Tips
                        </h4>
                        <ul className="space-y-1.5 text-xs text-blue-700">
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5">•</div>
                            <span>Use at least 8 characters with a mix of letters, numbers, and symbols</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5">•</div>
                            <span>Avoid using personal information like your name or birthdate</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5">•</div>
                            <span>Don't reuse passwords from other accounts or services</span>
                          </li>
                        </ul>
              </div>
            </CardContent>
                    <CardFooter className="pt-2">
              <Button type="submit" disabled={isUpdating} className="w-full rounded-full">
                {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : "Update Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
              </div>

              {/* Right Column - Forgot Password & Session Log */}
              <div className="space-y-6">
                <Card className="rounded-xl shadow-md border-0">
                  <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="bg-blue-100 p-2 rounded-full"><MailCheck className="h-5 w-5 text-blue-700" /></div>
            <div>
              <CardTitle>Forgot Password?</CardTitle>
                      <CardDescription>Send a password reset email to your account.</CardDescription>
            </div>
          </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600">
                      <p>If you've forgotten your password, we can help you reset it. We'll send a secure reset link to your email address.</p>
                    </div>
            <Button onClick={handleSendReset} disabled={isSendingReset} className="w-full rounded-full">
              {isSendingReset ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : `Send Reset Email to ${email || "your email"}`}
            </Button>
                    <div className="text-xs text-gray-500 italic">
                      <p>Note: The reset link will expire in 1 hour for security reasons.</p>
                    </div>
          </CardContent>
        </Card>

                <Card className="rounded-xl shadow-md border-0">
                  <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="bg-gray-100 p-2 rounded-full"><Clock className="h-5 w-5 text-gray-700" /></div>
            <div>
              <CardTitle>Session Log</CardTitle>
              <CardDescription>Recent login activity for your account.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
                    <div className="space-y-4">
                      {/* Current Session */}
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="bg-green-100 p-1.5 rounded-full">
                            {getDeviceIcon(sessionInfo?.device || "Desktop")}
                          </div>
                          <div>
                            <h4 className="font-medium text-green-800 text-sm">Current Session</h4>
                            <p className="text-xs text-green-600">
                              {sessionInfo?.browser || "Chrome"} on {sessionInfo?.device || "Desktop"}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-green-700">
                          <p>Active now</p>
                          <p className="text-xs mt-0.5">
                            {sessionInfo?.timestamp ? new Date(sessionInfo.timestamp.toDate()).toLocaleString() : "Just now"}
                          </p>
                        </div>
                      </div>

                      {/* Account Information */}
                      <div className="space-y-1.5 text-sm border-t pt-3">
                        <div className="flex items-center gap-2">
                          <MailCheck className="h-4 w-4 text-gray-500" />
                          <span><b>Email:</b> {email || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span><b>Last Login:</b> {lastLogin ? new Date(lastLogin).toLocaleString() : "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-gray-500" />
                          <span><b>Account Created:</b> {creationTime ? new Date(creationTime).toLocaleString() : "-"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <Card className="rounded-xl shadow-md border-0">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className="bg-purple-100 p-2 rounded-full"><FileText className="h-5 w-5 text-purple-700" /></div>
                <div>
                  <CardTitle>Community Guidelines</CardTitle>
                  <CardDescription>Rules and standards for maintaining a positive academic community.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Academic Integrity Section */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Academic Integrity
                  </h4>
                  <ul className="space-y-2 text-sm text-purple-700">
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>Maintain honesty and ethical standards in all academic discussions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>Share resources responsibly and cite sources appropriately</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>No sharing of exam answers or facilitating academic dishonesty</span>
                    </li>
                  </ul>
                </div>

                {/* Community Behavior Section */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Community Behavior
                  </h4>
                  <ul className="space-y-2 text-sm text-purple-700">
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>Be respectful and kind to all community members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>No hate speech, bullying, or harassment of any kind</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>Support fellow students with constructive feedback</span>
                    </li>
                  </ul>
                </div>

                {/* Privacy & Confidentiality Section */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Privacy & Confidentiality
                  </h4>
                  <ul className="space-y-2 text-sm text-purple-700">
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>Respect others' privacy and personal information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>Do not share personal details about students or faculty</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>Keep confidential academic information private</span>
                    </li>
                  </ul>
                </div>

                {/* Content Standards Section */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content Standards
                  </h4>
                  <ul className="space-y-2 text-sm text-purple-700">
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>Share content that adds value to the academic community</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>No inappropriate or non-academic content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>No spreading of misinformation about university policies</span>
                    </li>
                  </ul>
                </div>

                {/* Enforcement Section */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Enforcement
                  </h4>
                  <ul className="space-y-2 text-sm text-purple-700">
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>All content is subject to review by moderators</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>Violations may result in content removal or account restrictions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      <span>Report violations using the report button</span>
                    </li>
                  </ul>
                </div>

                <div className="text-xs text-purple-600 italic mt-4">
                  <p>By using this platform, you agree to follow these guidelines. The university reserves the right to take appropriate action for violations.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <Card className="rounded-xl shadow-md border-0">
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className="bg-blue-100 p-2 rounded-full"><HelpCircle className="h-5 w-5 text-blue-700" /></div>
                <div>
                  <CardTitle>Help & Support</CardTitle>
                  <CardDescription>Get assistance with your account and platform usage.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-blue-800 mb-2">Common Issues</h4>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5">•</div>
                        <span>Having trouble logging in? Try resetting your password</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5">•</div>
                        <span>Need to update your profile? Go to your profile settings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5">•</div>
                        <span>Questions about content? Check our community guidelines</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-blue-800 mb-2">Contact Support</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      If you need additional help, please contact our support team:
                    </p>
                    <Button 
                      className="w-full rounded-full" 
                      variant="outline"
                      asChild
                    >
                      <Link href="/user/feedback">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Submit Feedback
                      </Link>
                    </Button>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-blue-800 mb-2">Support Hours</h4>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5">•</div>
                        <span>Monday - Friday: 9:00 AM - 5:00 PM</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5">•</div>
                        <span>Response time: Within 24 hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5">•</div>
                        <span>Emergency support available 24/7</span>
                      </li>
                    </ul>
                  </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
