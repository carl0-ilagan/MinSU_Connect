"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, Clock, TrendingUp, ThumbsUp, Filter, Check } from "lucide-react"

export function SortFilter({ onSortChange, onFilterChange, sortOptions, filterOptions }) {
  const [activeSort, setActiveSort] = useState(sortOptions?.[0]?.value || "latest")
  const [activeFilters, setActiveFilters] = useState([])

  const handleSortChange = (value) => {
    setActiveSort(value)
    if (onSortChange) onSortChange(value)
  }

  const handleFilterChange = (value) => {
    let newFilters
    if (activeFilters.includes(value)) {
      newFilters = activeFilters.filter((filter) => filter !== value)
    } else {
      newFilters = [...activeFilters, value]
    }
    setActiveFilters(newFilters)
    if (onFilterChange) onFilterChange(newFilters)
  }

  const getSortIcon = (value) => {
    switch (value) {
      case "latest":
        return <Clock className="h-4 w-4" />
      case "popular":
        return <ThumbsUp className="h-4 w-4" />
      case "trending":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <ArrowUpDown className="h-4 w-4" />
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 rounded-full">
            <ArrowUpDown className="h-4 w-4" />
            <span>Sort by: </span>
            <span className="font-medium">
              {sortOptions?.find((option) => option.value === activeSort)?.label || "Latest"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 p-1 rounded-xl">
          {sortOptions?.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className={`flex items-center gap-2 rounded-lg ${activeSort === option.value ? "bg-primary/10 text-primary" : ""}`}
            >
              {getSortIcon(option.value)}
              <span>{option.label}</span>
              {activeSort === option.value && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {filterOptions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 rounded-full">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
              {activeFilters.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 p-1 rounded-xl">
            {filterOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleFilterChange(option.value)}
                className={`flex items-center gap-2 rounded-lg ${activeFilters.includes(option.value) ? "bg-primary/10 text-primary" : ""}`}
              >
                {option.icon}
                <span>{option.label}</span>
                {activeFilters.includes(option.value) && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
