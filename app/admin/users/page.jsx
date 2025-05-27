"use client"

import { useState, useEffect, Fragment } from "react"
import { PageBanner } from "@/components/ui/page-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Search,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Check,
  X,
  Trash2,
  PowerOff,
  Power,
  Building2,
  GraduationCap,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState(null)
  const { toast } = useToast()
  const [actionReason, setActionReason] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedCampus, setSelectedCampus] = useState("all")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)

  // Define campus options
  const campusOptions = [
    { value: "Main Campus", label: "Main Campus" },
    { value: "Calapan City Campus", label: "Calapan City Campus" },
    { value: "Bongabong Campus", label: "Bongabong Campus" },
  ]

  // Define all departments with their colleges and available campuses
  const allDepartments = [
    {
      college: "College of Agriculture and Allied Fields",
      departments: [
        {
          value: "Bachelor of Science in Agriculture",
          label: "Bachelor of Science in Agriculture",
          campuses: ["Main Campus"],
        },
        {
          value: "Bachelor of Science in Horticulture",
          label: "Bachelor of Science in Horticulture",
          campuses: ["Main Campus"],
        },
        {
          value: "Bachelor of Science in Agroforestry",
          label: "Bachelor of Science in Agroforestry",
          campuses: ["Main Campus"],
        },
      ],
    },
    {
      college: "College of Arts and Sciences",
      departments: [
        {
          value: "Bachelor of Arts in English Language",
          label: "Bachelor of Arts in English Language",
          campuses: ["Main Campus", "Calapan City Campus"],
        },
        {
          value: "Bachelor of Arts in Psychology",
          label: "Bachelor of Arts in Psychology",
          campuses: ["Calapan City Campus"],
        },
        {
          value: "Bachelor of Arts in Political Science",
          label: "Bachelor of Arts in Political Science",
          campuses: ["Bongabong Campus"],
        },
        {
          value: "Bachelor of Science in Environmental Science",
          label: "Bachelor of Science in Environmental Science",
          campuses: ["Main Campus"],
        },
      ],
    },
    {
      college: "College of Business and Management",
      departments: [
        {
          value: "Bachelor of Science in Entrepreneurship",
          label: "Bachelor of Science in Entrepreneurship",
          campuses: ["Main Campus"],
        },
        {
          value: "Bachelor of Science in Tourism Management",
          label: "Bachelor of Science in Tourism Management",
          campuses: ["Main Campus", "Calapan City Campus", "Bongabong Campus"],
        },
        {
          value: "Bachelor of Science in Hospitality Management",
          label: "Bachelor of Science in Hospitality Management",
          campuses: ["Calapan City Campus", "Bongabong Campus"],
        },
      ],
    },
    {
      college: "College of Computer Studies",
      departments: [
        {
          value: "Bachelor of Science in Information Technology",
          label: "Bachelor of Science in Information Technology",
          campuses: ["Main Campus", "Calapan City Campus", "Bongabong Campus"],
        },
        {
          value: "Bachelor of Science Computer Engineering",
          label: "Bachelor of Science Computer Engineering",
          campuses: ["Bongabong Campus"],
        },
      ],
    },
    {
      college: "College of Criminal Justice Education",
      departments: [
        {
          value: "Bachelor of Science in Criminology",
          label: "Bachelor of Science in Criminology",
          campuses: ["Calapan City Campus", "Bongabong Campus"],
        },
      ],
    },
    {
      college: "College of Teacher Education",
      departments: [
        {
          value: "Bachelor of Secondary Education",
          label: "Bachelor of Secondary Education",
          campuses: ["Main Campus", "Calapan City Campus", "Bongabong Campus"],
        },
        {
          value: "Bachelor of Elementary Education",
          label: "Bachelor of Elementary Education",
          campuses: ["Main Campus", "Bongabong Campus"],
        },
        {
          value: "Bachelor of Technical-Vocational Teacher Education",
          label: "Bachelor of Technical-Vocational Teacher Education",
          campuses: ["Calapan City Campus"],
        },
      ],
    },
    {
      college: "Institute of Agricultural and Biosystems Engineering",
      departments: [
        {
          value: "Bachelor of Agricultural and Biosystems Engineering",
          label: "Bachelor of Agricultural and Biosystems Engineering",
          campuses: ["Main Campus"],
        },
      ],
    },
    {
      college: "Institute of Fisheries",
      departments: [
        {
          value: "Bachelor of Science in Fisheries",
          label: "Bachelor of Science in Fisheries",
          campuses: ["Bongabong Campus"],
        },
      ],
    },
  ]

  // Fetch all users in real-time
  useEffect(() => {
    setIsLoading(true)
    const usersRef = collection(db, "users")
    const q = query(usersRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
            lastActive: data.lastActive?.toDate?.() || new Date(data.lastActive) || new Date(),
          }
        })
        .filter(user => user.email !== "admin@minsu.edu.ph") // Filter out admin account

      setAllUsers(fetchedUsers)
      setIsLoading(false)
    }, (error) => {
      console.error("Error fetching users:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    })

    return () => unsubscribe()
  }, [])

  // Update paginated and filtered users when allUsers, page, search, or program changes
  useEffect(() => {
    const filteredUsers = allUsers.filter(user => {
      const matchesSearch = 
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesDepartment = selectedDepartment === "all" || user.department === selectedDepartment
      const matchesCampus = selectedCampus === "all" || user.campus === selectedCampus
      
      return matchesSearch && matchesDepartment && matchesCampus
    })

    const startIndex = (currentPage - 1) * usersPerPage
    const endIndex = startIndex + usersPerPage
    setUsers(filteredUsers.slice(startIndex, endIndex))
  }, [allUsers, currentPage, searchQuery, selectedDepartment, selectedCampus, usersPerPage])

  const totalFilteredUsers = allUsers.filter(user => {
    const matchesSearch = 
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDepartment = selectedDepartment === "all" || user.department === selectedDepartment
    const matchesCampus = selectedCampus === "all" || user.campus === selectedCampus
    
    return matchesSearch && matchesDepartment && matchesCampus
  }).length
  const totalPages = Math.ceil(totalFilteredUsers / usersPerPage)

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page on new search
  }

  const handleUserAction = async (action) => {
    if (!selectedUser || !user) return

    try {
      const userRef = doc(db, "users", selectedUser.id)
      
      switch (action) {
        case "ban":
          await updateDoc(userRef, {
            isBanned: true,
            bannedAt: serverTimestamp(),
            bannedBy: user.uid,
            banReason: actionReason
          })
    toast({
      title: "User Banned",
      description: "The user has been banned from the platform.",
    })
          break

        case "unban":
          await updateDoc(userRef, {
            isBanned: false,
            unbannedAt: serverTimestamp(),
            unbannedBy: user.uid,
            banReason: null
          })
          toast({
            title: "User Unbanned",
            description: "The user has been unbanned from the platform.",
          })
          break

        case "deactivate":
          await updateDoc(userRef, {
            isDeactivated: true,
            deactivatedAt: serverTimestamp(),
            deactivatedBy: user.uid,
            deactivationReason: actionReason
          })
          toast({
            title: "User Deactivated",
            description: "The user account has been temporarily disabled.",
          })
          break

        case "activate":
          await updateDoc(userRef, {
            isDeactivated: false,
            activatedAt: serverTimestamp(),
            activatedBy: user.uid,
            deactivationReason: null
          })
          toast({
            title: "User Activated",
            description: "The user account has been reactivated.",
          })
          break

        case "delete":
          await updateDoc(userRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            deletedBy: user.uid
          })
          toast({
            title: "User Deleted",
            description: "The user account has been deleted.",
          })
          break
      }

      setShowActionDialog(false)
      setSelectedUser(null)
      setActionReason('')
    } catch (error) {
      console.error("Error managing user:", error)
    toast({
        title: "Error",
        description: "Failed to manage user. Please try again.",
        variant: "destructive",
    })
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        )
      case "banned":
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
            <Ban className="h-3 w-3 mr-1" /> Banned
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <>
      <PageBanner
        title="User Management"
        description="Manage user accounts and permissions."
        icon={<Users className="h-6 w-6 text-white" />}
      />

      <Card className="shadow-md border-0 rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Users Overview</CardTitle>
              <CardDescription>
                {isLoading ? "Loading..." : `${users.length} users shown (${allUsers.length} total)`}
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 bg-muted/50 border rounded-full focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <SelectValue placeholder="Filter by campus" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campuses</SelectItem>
                  {campusOptions.map((campus) => (
                    <SelectItem key={campus.value} value={campus.value}>
                      {campus.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[280px]">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <SelectValue placeholder="Filter by department" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {allDepartments.map((college) => (
                    <Fragment key={college.college}>
                      <SelectGroup>
                        <SelectLabel className="font-semibold text-primary">
                          {college.college}
                        </SelectLabel>
                        {college.departments.map((dept) => (
                          <SelectItem 
                            key={dept.value} 
                            value={dept.value}
                            disabled={selectedCampus !== "all" && !dept.campuses.includes(selectedCampus)}
                          >
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectSeparator />
                    </Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(usersPerPage)].map((_, i) => (
                <div key={i} className="h-20 w-full bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || user.profileImage} alt={user.displayName} />
                        <AvatarFallback>
                          {user.firstName?.[0] || user.lastName?.[0] || user.displayName?.[0] || "U"}
                        </AvatarFallback>
                          </Avatar>
                          <div>
                        <h3 className="font-medium">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.displayName || "Unknown User"}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                    <div className="flex items-center gap-2">
                      {user.isBanned && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <Ban className="h-3 w-3 mr-1" /> Banned
                        </Badge>
                      )}
                      {user.isDeactivated && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <PowerOff className="h-3 w-3 mr-1" /> Deactivated
                        </Badge>
                        )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin/users/${user.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Profile
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {!user.isBanned ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("ban");
                                  setShowActionDialog(true);
                                }}
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Ban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("unban");
                                  setShowActionDialog(true);
                                }}
                                className="text-green-600"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Unban User
                              </DropdownMenuItem>
                            )}
                            {!user.isDeactivated ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("deactivate");
                                  setShowActionDialog(true);
                                }}
                                className="text-amber-600"
                              >
                                <PowerOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("activate");
                                  setShowActionDialog(true);
                                }}
                                className="text-green-600"
                              >
                                <Power className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Last active {formatDistanceToNow(user.lastActive, { addSuffix: true })}
                    </span>
                    <span>Joined {formatDistanceToNow(user.createdAt, { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground">Try adjusting your search</p>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="transition-all duration-200"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="transition-all duration-200"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "ban" ? "Ban User" : 
               actionType === "unban" ? "Unban User" :
               actionType === "deactivate" ? "Deactivate User" :
               "Activate User"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "ban"
                ? "Are you sure you want to ban this user? They will not be able to access the platform."
                : actionType === "unban"
                ? "Are you sure you want to unban this user? They will regain access to the platform."
                : actionType === "deactivate"
                ? "Are you sure you want to deactivate this user? Their account will be temporarily disabled."
                : "Are you sure you want to activate this user? Their account will be re-enabled."}
            </DialogDescription>
          </DialogHeader>

          {(actionType === "ban" || actionType === "deactivate") && (
            <div className="space-y-4">
              <Textarea
                placeholder={`Enter reason for ${actionType === "ban" ? "banning" : "deactivating"} this user...`}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowActionDialog(false);
                setSelectedUser(null);
                setActionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "ban" ? "destructive" : "default"}
              onClick={() => handleUserAction(actionType)}
              disabled={(actionType === "ban" || actionType === "deactivate") && !actionReason.trim()}
            >
              {actionType === "ban" ? (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </>
              ) : actionType === "unban" ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Unban User
                </>
              ) : actionType === "deactivate" ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Deactivate User
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Activate User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
