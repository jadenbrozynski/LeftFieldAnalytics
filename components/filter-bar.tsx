"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export interface FilterOption {
  id: string
  label: string
  type: "select" | "text" | "number"
  options?: { value: string; label: string }[]
  placeholder?: string
}

interface FilterBarProps {
  filters: FilterOption[]
  values: Record<string, string>
  onFilterChange: (id: string, value: string) => void
  onClearFilters: () => void
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
}

export function FilterBar({
  filters,
  values,
  onFilterChange,
  onClearFilters,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
}: FilterBarProps) {
  const activeFiltersCount = Object.values(values).filter(Boolean).length + (searchValue ? 1 : 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {onSearchChange && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-white border-border"
            />
          </div>
        )}
        {filters.map((filter) => (
          <div key={filter.id} className="w-full sm:w-auto">
            {filter.type === "select" && filter.options && (
              <Select
                value={values[filter.id] || ""}
                onValueChange={(value) => onFilterChange(filter.id, value)}
              >
                <SelectTrigger className="w-full sm:w-[160px] bg-white border-border">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent className="bg-white border-border">
                  <SelectItem value="all">All {filter.label}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filter.type === "text" && (
              <Input
                placeholder={filter.placeholder || filter.label}
                value={values[filter.id] || ""}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                className="w-full sm:w-[160px] bg-white border-border"
              />
            )}
            {filter.type === "number" && (
              <Input
                type="number"
                placeholder={filter.placeholder || filter.label}
                value={values[filter.id] || ""}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                className="w-full sm:w-[120px] bg-white border-border"
              />
            )}
          </div>
        ))}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="mr-1 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {searchValue && (
            <Badge variant="secondary" className="gap-1 bg-[#00433a]/10 text-[#00433a] border-0">
              Search: {searchValue}
              <button
                onClick={() => onSearchChange?.("")}
                className="ml-1 hover:text-[#1a7a9e]"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {Object.entries(values).map(([key, value]) => {
            if (!value || value === "all") return null
            const filter = filters.find((f) => f.id === key)
            const option = filter?.options?.find((o) => o.value === value)
            return (
              <Badge key={key} variant="secondary" className="gap-1 bg-[#00433a]/10 text-[#00433a] border-0">
                {filter?.label}: {option?.label || value}
                <button
                  onClick={() => onFilterChange(key, "")}
                  className="ml-1 hover:text-[#1a7a9e]"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
