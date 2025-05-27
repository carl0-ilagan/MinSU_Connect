import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const bannerVariants = cva(
  "w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 md:p-10 rounded-xl mb-6 relative overflow-hidden shadow-lg mt-0",
  {
    variants: {
      size: {
        default: "min-h-[120px]",
        sm: "min-h-[100px]",
        lg: "min-h-[160px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
)

export function PageBanner({ title, description, size, className, children, ...props }) {
  return (
    <div className={cn(bannerVariants({ size }), className)} {...props}>
      <div className="relative z-10">
        {title && <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>}
        {description && <p className="text-white/90 max-w-2xl font-light">{description}</p>}
        {children}
      </div>
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
      <div className="absolute top-10 -left-10 w-40 h-40 bg-white/5 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full opacity-30"></div>
    </div>
  )
}
