import { headers } from 'next/headers'
import { redirect } from "next/navigation"

export default function Home() {
  const headersList = headers()
  const host = headersList.get('host')
  
  // Force redirect to welcome page with cache control
  const response = redirect('/welcome')
  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}
