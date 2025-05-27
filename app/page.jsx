import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default function Home() {
  // Check if user is authenticated
  const cookieStore = cookies()
  const authCookie = cookieStore.get("auth")
  
  if (authCookie) {
    // If authenticated, redirect to user dashboard
    redirect("/user")
  } else {
    // If not authenticated, redirect to welcome page
    redirect("/welcome")
  }
}
