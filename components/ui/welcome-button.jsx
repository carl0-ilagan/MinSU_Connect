import Link from "next/link"
import { cn } from "@/lib/utils"

export function WelcomeButton({ children, href, variant = "default", size = "default", className, ...props }) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"

  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    white: "bg-white text-primary hover:bg-white/90",
    outlineWhite: "border border-white text-white hover:bg-white/10",
  }

  const sizeStyles = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 px-8",
    icon: "h-10 w-10",
  }

  const classes = cn(baseStyles, variantStyles[variant], sizeStyles[size], className)

  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  )
}
