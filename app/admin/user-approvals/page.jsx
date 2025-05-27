"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { PageBanner } from "@/components/ui/page-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCheck, Search, Check, X, Eye, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

// Mock data
const mockPendingUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "/thoughtful-man.png",
    dateRegistered: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    bio: "I'm interested in connecting with others who share similar experiences.",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    avatar: "/woman-with-glasses.png",
    dateRegistered: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    bio: "Looking forward to being part of this community and sharing my journey.",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael.b@example.com",
    avatar: "/bearded-man-portrait.png",
    dateRegistered: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    bio: "Excited to join this platform and connect with others.",
  },
  {
    id: 4,
    name: "Emily Wilson",
    email: "emily.w@example.com",
    avatar: "/red-haired-woman.png",
    dateRegistered: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    bio: "Hoping to find support and share experiences with this community.",
  },
  {
    id: 5,
    name: "David Lee",
    email: "david.l@example.com",
    avatar: "/thoughtful-asian-man.png",
    dateRegistered: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    bio: "Looking for a supportive community to share my journey.",
  },
]

// Sample data for pending user approvals
const pendingUsersData = [
  {
    id: 1,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Patient",
    registrationDate: "2023-06-15",
    status: "pending",
  },
  {
    id: 2,
    name: "Robert Johnson",
    email: "robert.j@example.com",
    role: "Caregiver",
    registrationDate: "2023-06-14",
    status: "pending",
  },
  {
    id: 3,
    name: "Maria Garcia",
    email: "maria.g@example.com",
    role: "Healthcare Provider",
    registrationDate: "2023-06-14",
    status: "pending",
  },
  {
    id: 4,
    name: "David Lee",
    email: "david.lee@example.com",
    role: "Patient",
    registrationDate: "2023-06-13",
    status: "pending",
  },
  {
    id: 5,
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    role: "Caregiver",
    registrationDate: "2023-06-12",
    status: "pending",
  },
]

export default function UserApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [processingUser, setProcessingUser] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setPendingUsers(mockPendingUsers)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const filteredUsers = pendingUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleViewProfile = (user) => {
    setSelectedUser(user)
  }

  const handleApproveUser = (userId) => {
    setProcessingUser(userId)

    // Simulate API call
    setTimeout(() => {
      setPendingUsers(pendingUsers.filter((user) => user.id !== userId))
      setProcessingUser(null)
      toast({
        title: "User Approved",
        description: "The user has been approved and can now access the platform.",
      })
    }, 1000)
  }

  const handleRejectClick = (user) => {
    setSelectedUser(user)
    setShowRejectDialog(true)
  }

  const handleRejectUser = () => {
    if (!selectedUser) return

    setProcessingUser(selectedUser.id)
    setShowRejectDialog(false)

    // Simulate API call
    setTimeout(() => {
      setPendingUsers(pendingUsers.filter((user) => user.id !== selectedUser.id))
      setProcessingUser(null)
      toast({
        title: "User Rejected",
        description: "The user has been rejected and notified.",
      })
      setRejectionReason("")
      setSelectedUser(null)
    }, 1000)
  }

  return (
    <>
      <PageBanner
        title="User Approvals"
        description="Review and approve new user registrations"
        icon={<UserCheck className="h-6 w-6 text-white" />}
      />

      <Card className="shadow-md border-0 rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Pending Approvals</CardTitle>
              <CardDescription>
                {isLoading ? "Loading..." : `${filteredUsers.length} users waiting for approval`}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 bg-muted/50 border rounded-full focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending ({pendingUsers.length})</TabsTrigger>
              <TabsTrigger value="recent">Recently Approved</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <UserApprovalSkeleton key={i} />
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/10">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center mt-1">
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              Pending
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-2">
                              Registered {formatDistanceToNow(user.dateRegistered, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleViewProfile(user)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                          onClick={() => handleRejectClick(user)}
                          disabled={processingUser === user.id}
                        >
                          {processingUser === user.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 mr-1" />
                          )}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleApproveUser(user.id)}
                          disabled={processingUser === user.id}
                        >
                          {processingUser === user.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No pending approvals</h3>
                  <p className="text-muted-foreground">All user registrations have been processed</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent">
              <div className="text-center py-12">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No recent approvals</h3>
                <p className="text-muted-foreground">Recently approved users will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* User Profile Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>Review user details before approval</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 border-4 border-background">
                  <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} alt={selectedUser.name} />
                  <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold mt-2">{selectedUser.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                <p className="text-xs text-muted-foreground">
                  Registered {formatDistanceToNow(selectedUser.dateRegistered, { addSuffix: true })}
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Bio</h3>
                <p className="text-sm">{selectedUser.bio}</p>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="rounded-full sm:order-1 sm:ml-2"
                onClick={() => handleRejectClick(selectedUser)}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                className="rounded-full sm:order-2 sm:ml-2"
                onClick={() => {
                  handleApproveUser(selectedUser.id)
                  setSelectedUser(null)
                }}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this user registration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarImage src={selectedUser?.avatar || "/placeholder.svg"} alt={selectedUser?.name} />
                <AvatarFallback>{selectedUser?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{selectedUser?.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for rejection</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this user is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-full sm:order-1 sm:ml-2"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-full sm:order-2 sm:ml-2"
              onClick={handleRejectUser}
              disabled={!rejectionReason.trim()}
            >
              Reject User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function UserApprovalSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted"></div>
        <div>
          <div className="h-4 w-40 bg-muted rounded mb-2"></div>
          <div className="h-3 w-32 bg-muted rounded mb-2"></div>
          <div className="h-3 w-24 bg-muted rounded"></div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 sm:mt-0">
        <div className="h-8 w-16 bg-muted rounded-full"></div>
        <div className="h-8 w-16 bg-muted rounded-full"></div>
        <div className="h-8 w-20 bg-muted rounded-full"></div>
      </div>
    </div>
  )
}
