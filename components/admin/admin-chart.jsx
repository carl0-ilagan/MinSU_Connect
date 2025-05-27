"use client"

import { useEffect, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Chart, registerables } from "chart.js"

// Register Chart.js components
Chart.register(...registerables)

export function AdminChart({ type, data, height = 300, isLoading = false }) {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (isLoading || !data) return

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Create new chart
    const ctx = chartRef.current.getContext("2d")
    chartInstance.current = new Chart(ctx, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
        },
      },
    })

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [type, data, isLoading])

  if (isLoading) {
    return <Skeleton className="w-full" style={{ height: `${height}px` }} />
  }

  return <canvas ref={chartRef} height={height} />
}
