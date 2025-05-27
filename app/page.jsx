import { redirect } from "next/navigation"

export default function Home() {
  // Always redirect to welcome page from root
  redirect("/welcome")
}
