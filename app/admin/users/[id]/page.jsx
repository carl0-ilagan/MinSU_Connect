'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageBanner } from "@/components/ui/page-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Ban,
  PowerOff,
  Clock,
  Calendar,
  GraduationCap,
  MapPin,
  Mail,
  ArrowLeft,
  FileText,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { PostCard } from "@/components/post/post-card";
import { PostSkeleton } from "@/components/post/post-skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export default function AdminUserProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = params.id;

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            ...userData,
            id: userId,
            createdAt: userData.createdAt?.toDate?.() || new Date(userData.createdAt) || new Date(),
            lastActive: userData.lastActive?.toDate?.() || new Date(userData.lastActive) || new Date(),
          });
        } else {
          setError("User not found");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Error loading profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!userId) return;

      setPostsLoading(true);
      try {
        const postsRef = collection(db, "posts");
        const postsQuery = query(
          postsRef,
          where("userId", "==", userId),
          where("status", "==", "approved"),
          where("isAnonymous", "==", false),
          orderBy("createdAt", "desc")
        );

        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt) || new Date(),
        }));

        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast({
          title: "Error",
          description: "Failed to load user posts.",
          variant: "destructive",
        });
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, [userId, toast]);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!userId) return;

      setFriendsLoading(true);
      try {
        const friendshipsRef = collection(db, "friendships");
        const friendshipsQuery = query(
          friendshipsRef,
          where("users", "array-contains", userId)
        );

        const friendshipsSnapshot = await getDocs(friendshipsQuery);
        const friendIds = new Set();

        friendshipsSnapshot.forEach((doc) => {
          const friendship = doc.data();
          if (friendship.users && Array.isArray(friendship.users)) {
            friendship.users.forEach(id => {
              if (id !== userId) {
                friendIds.add(id);
              }
            });
          }
        });

        const friendProfiles = [];
        for (const friendId of friendIds) {
          const friendDoc = await getDoc(doc(db, "users", friendId));
          if (friendDoc.exists()) {
            friendProfiles.push({
              id: friendId,
              ...friendDoc.data(),
            });
          }
        }

        setFriends(friendProfiles);
      } catch (error) {
        console.error("Error fetching friends:", error);
        toast({
          title: "Error",
          description: "Failed to load user's friends.",
          variant: "destructive",
        });
      } finally {
        setFriendsLoading(false);
      }
    };

    fetchFriends();
  }, [userId, toast]);

  // Get full name
  const getFullName = (profile) => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile?.name || "User";
  };

  // Get initials for avatar
  const getInitials = (profile) => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (profile?.name) {
      return profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gradient-to-r from-green-400/20 to-emerald-500/20 animate-pulse rounded-lg"></div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="h-32 w-32 rounded-full bg-muted animate-pulse -mt-16 border-4 border-background"></div>
            <div className="pt-4 space-y-2">
              <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-destructive mb-4 text-5xl">😕</div>
        <h3 className="text-lg font-medium">{error}</h3>
        <p className="text-muted-foreground mt-2">
          The user you're looking for might not exist or you don't have permission to view this profile.
        </p>
        <Button className="mt-6" onClick={() => router.push("/admin/users")}>
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 md:p-10 rounded-xl relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute top-10 -left-10 w-40 h-40 bg-white/5 rounded-full"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/users")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white/90 shadow-lg">
              {userProfile.photoURL ? (
                <AvatarImage
                  src={userProfile.photoURL}
                  alt={getFullName(userProfile)}
                />
              ) : (
                <AvatarFallback className="text-2xl bg-white/20 text-white">
                  {getInitials(userProfile)}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{getFullName(userProfile)}</h1>
                  {userProfile.idNumber && (
                    <p className="text-white/80 mt-1">{userProfile.idNumber}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  {userProfile.isBanned && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <Ban className="h-3 w-3 mr-1" /> Banned
                    </Badge>
                  )}
                  {userProfile.isDeactivated && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <PowerOff className="h-3 w-3 mr-1" /> Deactivated
                    </Badge>
                  )}
                </div>
              </div>

              {userProfile.bio && (
                <p className="text-white/90 mt-2 max-w-2xl">{userProfile.bio}</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-white/90">
            <div className="space-y-2">
              {userProfile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-white/70" />
                  <span className="font-medium">Email:</span> {userProfile.email}
                </div>
              )}
              {userProfile.department && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-white/70" />
                  <span className="font-medium">Course:</span> {userProfile.department}
                </div>
              )}
              {userProfile.campus && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-white/70" />
                  <span className="font-medium">Campus:</span> {userProfile.campus}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {userProfile.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/70" />
                  <span className="font-medium">Joined:</span>{" "}
                  {formatDistanceToNow(userProfile.createdAt, { addSuffix: true })}
                </div>
              )}
              {userProfile.lastActive && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-white/70" />
                  <span className="font-medium">Last Active:</span>{" "}
                  {formatDistanceToNow(userProfile.lastActive, { addSuffix: true })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="mt-6">
        <TabsList className="w-full grid grid-cols-2 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger
            value="posts"
            className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3"
          >
            <FileText className="h-4 w-4" />
            <span>Posts</span>
            {posts.length > 0 && (
              <span className="ml-1.5 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                {posts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="friends"
            className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3"
          >
            <Users className="h-4 w-4" />
            <span>Friends</span>
            {friends.length > 0 && (
              <span className="ml-1.5 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                {friends.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {postsLoading ? (
            <div className="space-y-4">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
              <p className="text-muted-foreground">
                This user hasn't published any posts yet.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="friends" className="mt-6">
          {friendsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-muted rounded-lg mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : friends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-muted/20 hover:bg-muted/40 transition-colors rounded-lg p-4 text-center"
                >
                  <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-primary/10">
                    <AvatarImage
                      src={friend.photoURL || "/placeholder.svg"}
                      alt={`${friend.firstName} ${friend.lastName}`}
                    />
                    <AvatarFallback>
                      {friend.firstName?.[0]}
                      {friend.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium text-base">
                    {friend.firstName} {friend.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 space-y-1.5">
                    {friend.department && (
                      <p className="flex items-center justify-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {friend.department}
                      </p>
                    )}
                    {friend.campus && (
                      <p className="flex items-center justify-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {friend.campus}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No Friends Yet</h3>
              <p className="text-muted-foreground">This user hasn't added any friends yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
