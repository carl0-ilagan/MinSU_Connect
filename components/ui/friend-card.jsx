import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GraduationCap, MapPin } from "lucide-react"

export function FriendCard({ friend, showDepartment = true, showCampus = true, className = "" }) {
  const getFullName = (profile) => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`
    }
    return profile?.name || "User"
  }

  const getInitials = (profile) => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    }
    if (profile?.name) {
      return profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return "U"
  }

  const getShortProgram = (program) => {
    if (!program) return ""

    // Common abbreviations for programs
    const abbreviations = {
      "Bachelor of Science in Information Technology": "BSIT",
      "Bachelor of Science in Computer Science": "BSCS",
      "Bachelor of Science in Business Administration": "BSBA",
      "Bachelor of Elementary Education": "BEED",
      "Bachelor of Secondary Education": "BSED",
      "Bachelor of Science in Criminology": "BSCrim",
      "Bachelor of Science in Accountancy": "BSA",
      "Bachelor of Science in Tourism Management": "BSTM",
      "Bachelor of Science in Hospitality Management": "BSHM",
      "Bachelor of Science in Agriculture": "BSAgri",
    }

    return abbreviations[program] || program
  }

  return (
    <Link
      href={`/user/profile/${friend.id}`}
      className={`block p-4 rounded-lg border hover:bg-muted/50 transition-all duration-200 hover:shadow-md hover:border-primary/20 ${className}`}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <Avatar className="h-16 w-16 border-2 border-primary/10">
          <AvatarImage
            src={friend.photoURL || "/anonymous-user.jpeg"}
            alt={getFullName(friend)}
            onError={(e) => {
              e.target.src = "/anonymous-user.jpeg"
            }}
          />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials(friend)}</AvatarFallback>
        </Avatar>

        <div className="w-full space-y-1">
          <h3 className="font-medium text-sm leading-tight truncate w-full">{getFullName(friend)}</h3>

          {showDepartment && (friend.department || friend.program) && (
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <GraduationCap className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{getShortProgram(friend.department || friend.program)}</span>
            </div>
          )}

          {showCampus && friend.campus && (
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{friend.campus}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
