"use client"

import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, limit } from "firebase/firestore"

export function MobileSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef(null)
  const router = useRouter()

  const handleSearch = async (searchText) => {
    if (!searchText.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const usersRef = collection(db, "users")
      const searchTerm = searchText.toLowerCase()
      
      // Get all users and filter them client-side
      const q = query(usersRef, limit(20))
      const snapshot = await getDocs(q)
      
      const users = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => {
          const firstName = (user.firstName || '').toLowerCase()
          const lastName = (user.lastName || '').toLowerCase()
          const displayName = (user.displayName || '').toLowerCase()
          const department = (user.department || '').toLowerCase()
          
          return firstName.includes(searchTerm) || 
                 lastName.includes(searchTerm) ||
                 displayName.includes(searchTerm) ||
                 department.includes(searchTerm)
        })
        .slice(0, 5) // Limit to 5 results

      setSearchResults(users)
    } catch (error) {
      console.error("Error searching users:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleUserClick = (userId) => {
    setIsOpen(false)
    setSearchQuery("")
    router.push(`/user/profile/${userId}`)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 h-[80vh] flex flex-col">
          <DialogHeader className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>Search Users</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                className="pl-9 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="w-full p-4 hover:bg-muted/50 transition-colors flex items-center gap-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.profileImage || user.photoURL}
                        alt={user.firstName || user.displayName}
                      />
                      <AvatarFallback>
                        {user.firstName?.[0]}{user.lastName?.[0] || user.displayName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="font-medium">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.displayName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.department || user.campus || "Student"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="p-4 text-center text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Start typing to search users
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 