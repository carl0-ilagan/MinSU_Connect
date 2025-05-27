import { Skeleton } from "@/components/ui/skeleton"
import { PageBanner } from "@/components/ui/page-banner"

export default function FriendsLoading() {
  return (
    <div className="space-y-6">
      <PageBanner
        title="Friends & Connections"
        description="Manage your friend requests and connections with other members of the community."
      />

      <div className="space-y-4">
        <div className="flex space-x-2 mb-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>

        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 shadow-sm border">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-60" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
