"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

export function AdminStatCard({ title, value, description, icon, trend, color = "green", isLoading = false }) {
  const getColorClasses = () => {
    switch (color) {
      case "amber":
        return {
          bgLight: "bg-amber-100",
          textColor: "text-amber-600",
        }
      case "red":
        return {
          bgLight: "bg-red-100",
          textColor: "text-red-600",
        }
      case "blue":
        return {
          bgLight: "bg-blue-100",
          textColor: "text-blue-600",
        }
      case "purple":
        return {
          bgLight: "bg-purple-100",
          textColor: "text-purple-600",
        }
      default:
        return {
          bgLight: "bg-green-100",
          textColor: "text-green-600",
        }
    }
  }

  const { bgLight, textColor } = getColorClasses()

  return (
    <Card className="shadow-md border-0 rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <h3 className="text-2xl font-bold mt-1">{value.toLocaleString()}</h3>
                <div className="flex items-center mt-1">
                  {trend && (
                    <>
                      {trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                      )}
                      <span className={`text-xs ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
                        {description}
                      </span>
                    </>
                  )}
                  {!trend && <span className="text-xs text-muted-foreground">{description}</span>}
                </div>
              </>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : (
            <div className={`${bgLight} ${textColor} p-2 rounded-full`}>{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
