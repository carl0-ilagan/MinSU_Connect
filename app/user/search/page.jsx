"use client"

import { useState } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { PageBanner } from "@/components/ui/page-banner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchIcon, User, FileText, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Mock search results
  const mockUsers = [
    {
      id: 1,
      name: "Jane Smith",
      avatar: "/diverse-woman-portrait.png",
      type: "user",
    },
    {
      id: 2,
      name: "John Doe",
      avatar: "/thoughtful-man.png",
      type: "user",
    },
  ]

  const mockPosts = [
    {
      id: 1,
      title: "Just finished my latest project!",
      user: "Jane Smith",
      timestamp: "2 hours ago",
      type: "post",
    },
    {
      id: 2,
      title: "Had an amazing time at the community meetup yesterday",
      user: "Michael Brown",
      timestamp: "5 hours ago",
      type: "post",
    },
  ]

  const handleSearch = (e) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    setIsSearching(true)

    // Simulate API call
    setTimeout(() => {
      const results = [
        ...mockUsers.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase())),
        ...mockPosts.filter((post) => post.title.toLowerCase().includes(searchQuery.toLowerCase())),
      ]

      setSearchResults(results)
      setIsSearching(false)
    }, 500)
  }

  return (
    <PageLayout>
      <PageBanner title="Search" description="Find users, posts, and content across the community." />

      <div className="max-w-2xl mx-auto">
        <Card className="mb-6 animate-in">
          <CardHeader>
            <CardTitle>Search MBC Connect</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="search"
                  placeholder="Search for users or posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {searchResults.length > 0 && (
          <Card className="animate-in">
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted rounded-md transition-colors"
                >
                  {result.type === "user" ? (
                    <>
                      <Avatar>
                        <AvatarImage src={result.avatar || "/placeholder.svg"} alt={result.name} />
                        <AvatarFallback>{result.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Link
                          href={`/user/profile/${result.id}`}
                          className="font-medium hover:underline flex items-center gap-1"
                        >
                          <User className="h-3 w-3" />
                          {result.name}
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/user/post/${result.id}`}
                          className="font-medium hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          {result.title}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          By {result.user} • {result.timestamp}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {searchQuery && searchResults.length === 0 && !isSearching && (
          <Card className="animate-in">
            <CardContent className="p-8 text-center">
              <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
