import { Manrope } from "next/font/google"
import "./globals.css"
import RootLayoutClient from "./layout-client"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
})

export const metadata = {
  title: "MBC Connect",
  description: "Connect with others in the MBC community",
  icons: {
    icon: "/MINSU.png",
    apple: "/MINSU.png",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="icon" href="/MINSU.png" />
      </head>
      <body className={`${manrope.variable} font-manrope`}>
        <RootLayoutClient>
            {children}
        </RootLayoutClient>
      </body>
    </html>
  )
}
