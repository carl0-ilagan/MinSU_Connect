"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

export function UserSearch({ className }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)
  const router = useRouter()

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearch.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const usersRef = collection(db, "users")
        const searchTerm = debouncedSearch.toLowerCase()
        console.log("Searching for:", searchTerm)
        
        // Get all users and filter them client-side for more flexible matching
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
            return firstName.includes(searchTerm) || lastName.includes(searchTerm)
          })
          .slice(0, 5) // Limit to 5 results

        console.log("Search results:", users)
        setResults(users)
      } catch (error) {
        console.error("Error searching users:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    searchUsers()
  }, [debouncedSearch])

  const handleUserClick = (userId) => {
    router.push(`/user/profile/${userId}`)
    setShowResults(false)
    setSearchQuery("")
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          type="search"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          className="pl-9 h-9 rounded-full bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Results Dropdown */}
      {showResults && (searchQuery.trim() || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover rounded-lg shadow-lg border overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImage || user.photoURL} alt={user.firstName} />
                    <AvatarFallback>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {user.department || user.campus || "Student"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  )
} 