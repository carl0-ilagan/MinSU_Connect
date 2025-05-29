"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageBanner } from "@/components/ui/page-banner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Users, FileText, BarChart3, PieChart, LineChart, AlertTriangle, Building2, GraduationCap, Download } from "lucide-react"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { AdminChart } from "@/components/admin/admin-chart"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { subDays, format, startOfDay, endOfDay } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

const NoDataAnimation = ({ campus }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg font-medium"
        >
          No Data Available
        </motion.p>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-sm mt-2"
        >
          {campus === "all" 
            ? "No users found in any campus" 
            : `No users found in ${campus}`}
        </motion.p>
      </motion.div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    declinedPosts: 0,
  })
  const [selectedCampus, setSelectedCampus] = useState("all")
  const [userDistribution, setUserDistribution] = useState({
    byProgram: [],
    byCampus: []
  })
  const [activityData, setActivityData] = useState({
    registrations: [],
    posts: [],
    logins: []
  })

  // Define campus options
  const campusOptions = [
    { value: "all", label: "All Campuses" },
    { value: "Main Campus", label: "Main Campus" },
    { value: "Calapan City Campus", label: "Calapan City Campus" },
    { value: "Bongabong Campus", label: "Bongabong Campus" },
  ]

  // Get last 7 days dates
  const getLast7Days = () => {
    const dates = []
    for (let i = 6; i >= 0; i--) {
      dates.push(format(subDays(new Date(), i), 'EEE'))
    }
    return dates
  }

  const handleExportReports = async () => {
    try {
      // Fetch all data
      const usersRef = collection(db, "users")
      const usersSnapshot = await getDocs(usersRef)
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Filter out admin users
      const filteredUsers = users.filter(user => user.email !== "admin@minsu.edu.ph")

      // Prepare data for export
      const exportData = {
        stats: {
          totalUsers: filteredUsers.length,
          totalPosts: stats.totalPosts,
          declinedPosts: stats.declinedPosts,
        },
        programDistribution: userDistribution.byProgram,
        campusDistribution: userDistribution.byCampus,
        activityData: {
          registrations: activityData.registrations,
          posts: activityData.posts,
          logins: activityData.logins,
          dates: getLast7Days()
        }
      }

      // Convert to CSV format
      const csvContent = [
        // Stats
        "Dashboard Statistics",
        `Total Users,${exportData.stats.totalUsers}`,
        `Total Posts,${exportData.stats.totalPosts}`,
        `Declined Posts,${exportData.stats.declinedPosts}`,
        "",
        // Program Distribution
        "Program Distribution",
        "Program,Count",
        ...exportData.programDistribution.map(item => `${item.program},${item.count}`),
        "",
        // Campus Distribution
        "Campus Distribution",
        "Campus,Count",
        ...exportData.campusDistribution.map(item => `${item.campus},${item.count}`),
        "",
        // Activity Data
        "Activity Data (Last 7 Days)",
        "Date,Registrations,Posts,Logins",
        ...exportData.activityData.dates.map((date, index) => 
          `${date},${exportData.activityData.registrations[index]},${exportData.activityData.posts[index]},${exportData.activityData.logins[index]}`
        )
      ].join("\n")

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `dashboard-report-${format(new Date(), "yyyy-MM-dd")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: "Report exported successfully",
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch users
        const usersRef = collection(db, "users")
        const usersSnapshot = await getDocs(usersRef)
        const users = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.email !== "admin@minsu.edu.ph") // Filter out admin users
        
        // Fetch posts
        const postsRef = collection(db, "posts")
        const postsSnapshot = await getDocs(postsRef)
        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        // Calculate stats
        const totalUsers = users.length
        const totalPosts = posts.length
        const declinedPosts = posts.filter(post => post.status === "declined").length

        // Calculate program distribution (excluding administration)
        const programDistribution = users.reduce((acc, user) => {
          if (selectedCampus === "all" || user.campus === selectedCampus) {
            if (user.department && !user.department.toLowerCase().includes("administration")) {
              acc[user.department] = (acc[user.department] || 0) + 1
            }
          }
          return acc
        }, {})

        // Calculate campus distribution
        const campusDistribution = users.reduce((acc, user) => {
          if (user.campus) {
            acc[user.campus] = (acc[user.campus] || 0) + 1
          }
          return acc
        }, {})

        // Calculate activity data for last 7 days
        const last7Days = getLast7Days()
        const activityData = {
          registrations: new Array(7).fill(0),
          posts: new Array(7).fill(0),
          logins: new Array(7).fill(0)
        }

        // Process registrations
        users.forEach(user => {
          const createdAt = user.createdAt?.toDate?.() || new Date(user.createdAt)
          const dayIndex = 6 - Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24))
          if (dayIndex >= 0 && dayIndex < 7) {
            activityData.registrations[dayIndex]++
          }
        })

        // Process posts
        posts.forEach(post => {
          const createdAt = post.createdAt?.toDate?.() || new Date(post.createdAt)
          const dayIndex = 6 - Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24))
          if (dayIndex >= 0 && dayIndex < 7) {
            activityData.posts[dayIndex]++
          }
        })

        // Process logins (assuming you have a loginHistory collection)
        const loginHistoryRef = collection(db, "loginHistory")
        const loginHistorySnapshot = await getDocs(loginHistoryRef)
        const logins = loginHistorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
        logins.forEach(login => {
          const loginTime = login.timestamp?.toDate?.() || new Date(login.timestamp)
          const dayIndex = 6 - Math.floor((new Date() - loginTime) / (1000 * 60 * 60 * 24))
          if (dayIndex >= 0 && dayIndex < 7) {
            activityData.logins[dayIndex]++
          }
        })

        setStats({
          totalUsers,
          totalPosts,
          declinedPosts,
        })

        setUserDistribution({
          byProgram: Object.entries(programDistribution)
            .map(([program, count]) => ({
              program,
              count
            }))
            .sort((a, b) => b.count - a.count), // Sort by count descending
          byCampus: Object.entries(campusDistribution)
            .map(([campus, count]) => ({
              campus,
              count
            }))
            .sort((a, b) => b.count - a.count) // Sort by count descending
        })

        setActivityData(activityData)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [selectedCampus])

  return (
    <div>
      <PageBanner
        title="Admin Dashboard"
        description="Welcome to the MINSU Connect admin dashboard. Monitor and manage community activity."
        className="mt-0"
      />

      <div className="max-w-full mx-auto py-6 w-full px-2 sm:px-4 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 mt-6">
          <AdminStatCard
            title="Total Users"
            value={stats.totalUsers}
            description="Active users"
            icon={<Users className="h-5 w-5" />}
            trend="up"
            isLoading={isLoading}
          />
          <AdminStatCard
            title="Total Posts"
            value={stats.totalPosts}
            description="Total content"
            icon={<FileText className="h-5 w-5" />}
            trend="up"
            isLoading={isLoading}
          />
          <AdminStatCard
            title="Declined Posts"
            value={stats.declinedPosts}
            description="Rejected content"
            icon={<AlertTriangle className="h-5 w-5" />}
            trend="down"
            color="red"
            isLoading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-sm border rounded-xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                    Program Distribution
                  </CardTitle>
                  <CardDescription>Users by program</CardDescription>
                </div>
                <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <SelectValue placeholder="Select campus" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {campusOptions.map((campus) => (
                      <SelectItem key={campus.value} value={campus.value}>
                        {campus.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : userDistribution.byProgram.length === 0 ? (
                <NoDataAnimation campus={selectedCampus === "all" ? "all" : campusOptions.find(c => c.value === selectedCampus)?.label} />
              ) : (
                <AdminChart
                  type="pie"
                  height={300}
                  isLoading={isLoading}
                  data={{
                    labels: userDistribution.byProgram.map(item => item.program),
                    datasets: [
                      {
                        data: userDistribution.byProgram.map(item => item.count),
                        backgroundColor: [
                          "rgba(34, 197, 94, 0.7)",
                          "rgba(59, 130, 246, 0.7)",
                          "rgba(139, 92, 246, 0.7)",
                          "rgba(234, 179, 8, 0.7)",
                          "rgba(239, 68, 68, 0.7)",
                          "rgba(16, 185, 129, 0.7)",
                          "rgba(245, 158, 11, 0.7)",
                          "rgba(14, 165, 233, 0.7)",
                        ],
                        borderColor: [
                          "rgb(34, 197, 94)",
                          "rgb(59, 130, 246)",
                          "rgb(139, 92, 246)",
                          "rgb(234, 179, 8)",
                          "rgb(239, 68, 68)",
                          "rgb(16, 185, 129)",
                          "rgb(245, 158, 11)",
                          "rgb(14, 165, 233)",
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                />
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border rounded-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-primary" />
                Campus Distribution
              </CardTitle>
              <CardDescription>Users by campus</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminChart
                type="pie"
                height={300}
                isLoading={isLoading}
                data={{
                  labels: userDistribution.byCampus.map(item => item.campus),
                  datasets: [
                    {
                      data: userDistribution.byCampus.map(item => item.count),
                      backgroundColor: [
                        "rgba(34, 197, 94, 0.7)",
                        "rgba(59, 130, 246, 0.7)",
                        "rgba(139, 92, 246, 0.7)",
                      ],
                      borderColor: [
                        "rgb(34, 197, 94)",
                        "rgb(59, 130, 246)",
                        "rgb(139, 92, 246)",
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="shadow-sm border rounded-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Platform activity in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="registrations">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="registrations">New Registrations</TabsTrigger>
                  <TabsTrigger value="posts">New Posts</TabsTrigger>
                  <TabsTrigger value="logins">Login Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="registrations">
                  <AdminChart
                    type="bar"
                    height={300}
                    isLoading={isLoading}
                    data={{
                      labels: getLast7Days(),
                      datasets: [
                        {
                          label: "New Users",
                          data: activityData.registrations,
                          backgroundColor: "rgba(34, 197, 94, 0.7)",
                          borderColor: "rgb(34, 197, 94)",
                          borderWidth: 1,
                        },
                      ],
                    }}
                  />
                </TabsContent>
                <TabsContent value="posts">
                  <AdminChart
                    type="bar"
                    height={300}
                    isLoading={isLoading}
                    data={{
                      labels: getLast7Days(),
                      datasets: [
                        {
                          label: "New Posts",
                          data: activityData.posts,
                          backgroundColor: "rgba(59, 130, 246, 0.7)",
                          borderColor: "rgb(59, 130, 246)",
                          borderWidth: 1,
                        },
                      ],
                    }}
                  />
                </TabsContent>
                <TabsContent value="logins">
                  <AdminChart
                    type="line"
                    height={300}
                    isLoading={isLoading}
                    data={{
                      labels: getLast7Days(),
                      datasets: [
                        {
                          label: "Login Activity",
                          data: activityData.logins,
                          borderColor: "rgb(139, 92, 246)",
                          backgroundColor: "rgba(139, 92, 246, 0.1)",
                          tension: 0.3,
                          fill: true,
                        },
                      ],
                    }}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            variant="outline" 
            className="rounded-full"
            onClick={handleExportReports}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
        </div>
      </div>
    </div>
  )
}
