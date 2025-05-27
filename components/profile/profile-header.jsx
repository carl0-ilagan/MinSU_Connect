"use client"

// This component is no longer used as the functionality has been moved directly into the profile pages
export function ProfileHeader() {
  return null
}

// Update the component props to accept bannerColors
// export function ProfileHeader({ user, isCurrentUser = true, friendStatus = "none" }) {
//   const { user: currentUser } = useAuth()
//   const { toast } = useToast()
//   const [localFriendStatus, setLocalFriendStatus] = useState(friendStatus)
//   const [isLoading, setIsLoading] = useState(false)

//   // Update the local state when the prop changes
//   useEffect(() => {
//     setLocalFriendStatus(friendStatus)
//   }, [friendStatus])

//   // Get user initials for avatar fallback
//   const getInitials = () => {
//     if (user.firstName && user.lastName) {
//       return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
//     }
//     if (user.name) {
//       return user.name
//         .split(" ")
//         .map((n) => n[0])
//         .join("")
//         .toUpperCase()
//     }
//     return "U"
//   }

//   // Get full name
//   const getFullName = () => {
//     if (user.firstName && user.lastName) {
//       return `${user.firstName} ${user.lastName}`
//     }
//     return user.name || "User"
//   }

//   // Format date to readable format
//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A"
//     const date = new Date(dateString)
//     return new Intl.DateTimeFormat("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     }).format(date)
//   }

//   // Update the getProfilePicture function
//   const getProfilePicture = () => {
//     // Check for photoURL
//     if (user.photoURL) {
//       return user.photoURL
//     }
//     // Return null if no photo URL found
//     return null
//   }

//   const profilePicture = getProfilePicture()

//   // Handle friend request
//   const handleFriendRequest = async () => {
//     if (!currentUser) {
//       toast({
//         title: "Authentication required",
//         description: "Please log in to send friend requests",
//         variant: "destructive",
//       })
//       return
//     }

//     setIsLoading(true)

//     try {
//       // Create a friend request
//       const friendRequestRef = doc(db, "friendRequests", `${currentUser.uid}_${user.id}`)
//       await setDoc(friendRequestRef, {
//         senderId: currentUser.uid,
//         senderName: currentUser.displayName || "User",
//         senderPhoto: currentUser.photoURL,
//         receiverId: user.id,
//         receiverName: getFullName(),
//         receiverPhoto: user.photoURL,
//         status: "pending",
//         createdAt: new Date(),
//       })

//       // Update user's friend requests array
//       const userRef = doc(db, "users", user.id)
//       await updateDoc(userRef, {
//         friendRequests: arrayUnion({
//           userId: currentUser.uid,
//           status: "pending",
//           timestamp: new Date(),
//         }),
//       })

//       setLocalFriendStatus("pending")
//       toast({
//         title: "Friend request sent",
//         description: `Your friend request to ${getFullName()} has been sent.`,
//       })
//     } catch (error) {
//       console.error("Error sending friend request:", error)
//       toast({
//         title: "Error",
//         description: "Failed to send friend request. Please try again.",
//         variant: "destructive",
//       })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Handle cancel friend request
//   const handleCancelRequest = async () => {
//     setIsLoading(true)

//     try {
//       // Delete the friend request
//       const friendRequestRef = doc(db, "friendRequests", `${currentUser.uid}_${user.id}`)
//       await updateDoc(friendRequestRef, {
//         status: "cancelled",
//       })

//       // Update user's friend requests array
//       const userRef = doc(db, "users", user.id)
//       await updateDoc(userRef, {
//         friendRequests: arrayRemove({
//           userId: currentUser.uid,
//           status: "pending",
//         }),
//       })

//       setLocalFriendStatus("none")
//       toast({
//         title: "Request cancelled",
//         description: "Your friend request has been cancelled.",
//       })
//     } catch (error) {
//       console.error("Error cancelling friend request:", error)
//       toast({
//         title: "Error",
//         description: "Failed to cancel friend request. Please try again.",
//         variant: "destructive",
//       })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Handle unfriend
//   const handleUnfriend = async () => {
//     setIsLoading(true)

//     try {
//       // Update both users' friends lists
//       const currentUserRef = doc(db, "users", currentUser.uid)
//       const otherUserRef = doc(db, "users", user.id)

//       // Remove from current user's friends
//       await updateDoc(currentUserRef, {
//         friends: arrayRemove(user.id),
//       })

//       // Remove from other user's friends
//       await updateDoc(otherUserRef, {
//         friends: arrayRemove(currentUser.uid),
//       })

//       setLocalFriendStatus("none")
//       toast({
//         title: "Friend removed",
//         description: `${getFullName()} has been removed from your friends.`,
//       })
//     } catch (error) {
//       console.error("Error removing friend:", error)
//       toast({
//         title: "Error",
//         description: "Failed to remove friend. Please try again.",
//         variant: "destructive",
//       })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Check if users are friends to enable messaging
//   const canMessage = localFriendStatus === "accepted" || isCurrentUser

//   return (
//     <Card className="mb-6 overflow-hidden animate-in shadow-md">
//       <div className="h-32 bg-gradient-to-r from-green-400 to-emerald-500 relative overflow-hidden">
//         {/* Add decorative elements to the banner */}
//         <div className="absolute inset-0 opacity-20">
//           <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-white/20"></div>
//           <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full bg-white/10"></div>
//           <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-white/15"></div>
//         </div>
//       </div>
//       <CardContent className="pt-0">
//         <div className="flex flex-col sm:flex-row gap-4 -mt-12 sm:-mt-16">
//           <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
//             {profilePicture ? (
//               <AvatarImage
//                 src={profilePicture || "/placeholder.svg"}
//                 alt={getFullName()}
//                 onError={(e) => {
//                   console.error("Error loading profile header image:", e)
//                 }}
//               />
//             ) : (
//               <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
//             )}
//           </Avatar>

//           <div className="flex-1 pt-12 sm:pt-0">
//             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
//               <div>
//                 <h2 className="text-2xl font-bold">{getFullName()}</h2>
//                 {/* Don't display ID number for other users */}
//                 {isCurrentUser && user.idNumber && <p className="text-muted-foreground">{user.idNumber}</p>}
//               </div>

//               <div className="flex gap-2 mt-2 sm:mt-0">
//                 {isCurrentUser ? (
//                   <>
//                     <Button variant="outline" size="sm" asChild>
//                       <Link href="/user/settings/profile">
//                         <Edit className="h-4 w-4 mr-2" />
//                         Edit Profile
//                       </Link>
//                     </Button>
//                     <Button variant="outline" size="sm" asChild>
//                       <Link href="/user/settings">
//                         <Settings className="h-4 w-4 mr-2" />
//                         Settings
//                       </Link>
//                     </Button>
//                   </>
//                 ) : (
//                   <>
//                     {/* Friend Request Button - Enhanced with primary color */}
//                     {localFriendStatus === "none" && (
//                       <Button
//                         variant="default"
//                         size="sm"
//                         onClick={handleFriendRequest}
//                         disabled={isLoading}
//                         className="flex items-center"
//                       >
//                         <UserPlus className="h-4 w-4 mr-2" />
//                         <span>Add Friend</span>
//                       </Button>
//                     )}

//                     {localFriendStatus === "pending" && (
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={handleCancelRequest}
//                         disabled={isLoading}
//                         className="flex items-center"
//                       >
//                         <Clock className="h-4 w-4 mr-2" />
//                         <span>Cancel Request</span>
//                       </Button>
//                     )}

//                     {localFriendStatus === "accepted" && (
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={handleUnfriend}
//                         disabled={isLoading}
//                         className="flex items-center"
//                       >
//                         <UserCheck className="h-4 w-4 mr-2" />
//                         <span>Friends</span>
//                       </Button>
//                     )}

//                     {localFriendStatus === "declined" && (
//                       <Button variant="outline" size="sm" disabled={true} className="flex items-center">
//                         <UserX className="h-4 w-4 mr-2" />
//                         <span>Request Declined</span>
//                       </Button>
//                     )}

//                     {/* Message Button - Enhanced with secondary color when enabled */}
//                     <Button
//                       variant={canMessage ? "secondary" : "outline"}
//                       size="sm"
//                       asChild={canMessage}
//                       disabled={!canMessage}
//                       title={!canMessage ? "You must be friends to message" : ""}
//                       className="flex items-center"
//                     >
//                       {canMessage ? (
//                         <Link href={`/user/messages?user=${user.id}`} className="flex items-center">
//                           <MessageSquare className="h-4 w-4 mr-2" />
//                           <span>Message</span>
//                         </Link>
//                       ) : (
//                         <span className="flex items-center">
//                           <MessageSquare className="h-4 w-4 mr-2" />
//                           <span>Message</span>
//                         </span>
//                       )}
//                     </Button>
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* Academic Information */}
//             <div className="flex flex-wrap gap-2 mt-4">
//               {user.department && (
//                 <Badge variant="outline" className="flex items-center gap-1 py-1">
//                   <GraduationCap className="h-3.5 w-3.5" />
//                   <span>{user.department}</span>
//                 </Badge>
//               )}
//               {user.campus && (
//                 <Badge variant="outline" className="flex items-center gap-1 py-1">
//                   <School className="h-3.5 w-3.5" />
//                   <span>{user.campus}</span>
//                 </Badge>
//               )}
//               {user.location && (
//                 <Badge variant="outline" className="flex items-center gap-1 py-1">
//                   <MapPin className="h-3.5 w-3.5" />
//                   <span>{user.location}</span>
//                 </Badge>
//               )}
//               {user.position && (
//                 <Badge variant="outline" className="flex items-center gap-1 py-1">
//                   <Briefcase className="h-3.5 w-3.5" />
//                   <span>{user.position}</span>
//                 </Badge>
//               )}
//               {user.createdAt && (
//                 <Badge variant="outline" className="flex items-center gap-1 py-1">
//                   <Calendar className="h-3.5 w-3.5" />
//                   <span>Joined {formatDate(user.createdAt)}</span>
//                 </Badge>
//               )}
//             </div>

//             {/* Hobbies */}
//             {user.hobbies && user.hobbies.length > 0 && (
//               <div className="flex flex-wrap gap-1.5 mt-3">
//                 {user.hobbies.map((hobby, index) => (
//                   <Badge key={index} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
//                     {hobby}
//                   </Badge>
//                 ))}
//               </div>
//             )}

//             <div className="flex gap-4 mt-4 text-sm">
//               <div>
//                 <span className="font-bold">{user.posts || 0}</span> Posts
//               </div>
//               <div>
//                 <span className="font-bold">{user.friends?.length || 0}</span> Friends
//               </div>
//             </div>
//           </div>
//         </div>

//         <Tabs defaultValue="posts" className="mt-6">
//           <TabsList className="w-full grid grid-cols-2">
//             <TabsTrigger value="posts" className="flex-1">
//               Posts
//             </TabsTrigger>
//             <TabsTrigger value="friends" className="flex-1">
//               Friends
//             </TabsTrigger>
//           </TabsList>
//         </Tabs>
//       </CardContent>
//     </Card>
//   )
// }
