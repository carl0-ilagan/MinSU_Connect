import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"

export default function MessagesLoading() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile view */}
      <div className="md:hidden flex flex-col h-full">
        <div className="flex items-center p-4 border-b">
          <div className="h-9 w-9 flex items-center justify-center mr-2">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold">Messages</h1>
        </div>

        <div className="p-2">
          <Skeleton className="h-10 w-full rounded-full" />
        </div>

        <div className="flex-1 p-4 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:flex h-full">
        {/* Conversation list */}
        <div className="w-1/3 border-r flex flex-col h-full">
          <div className="flex items-center p-4 border-b">
            <div className="h-9 w-9 flex items-center justify-center mr-2">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Messages</h1>
          </div>

          <div className="p-2">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>

          <div className="flex-1 p-4 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation view */}
        <div className="w-2/3 flex flex-col items-center justify-center h-full text-center p-8">
          <Skeleton className="h-24 w-24 rounded-full mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
        </div>
      </div>
    </div>
  )
}
