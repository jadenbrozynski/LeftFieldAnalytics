"use client"

import * as React from "react"
import { History } from "lucide-react"
import { mockProfileChanges } from "@/lib/mock-data"
import { TimelineView } from "@/components/timeline-view"
import { FilterBar, FilterOption } from "@/components/filter-bar"
import { StatsRow, StatItem } from "@/components/stats-row"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

const filterOptions: FilterOption[] = [
  {
    id: "field",
    label: "Field",
    type: "select",
    options: [
      { value: "status", label: "Status" },
      { value: "bio", label: "Bio" },
      { value: "neighborhood", label: "Neighborhood" },
      { value: "job_title", label: "Job Title" },
    ],
  },
  {
    id: "changed_by",
    label: "Changed By",
    type: "select",
    options: [
      { value: "user", label: "User" },
      { value: "admin", label: "Admin" },
      { value: "system", label: "System" },
    ],
  },
]

export default function TimelinePage() {
  const [search, setSearch] = React.useState("")
  const [filters, setFilters] = React.useState<Record<string, string>>({})

  const handleFilterChange = (id: string, value: string) => {
    setFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearch("")
  }

  const filteredChanges = React.useMemo(() => {
    return mockProfileChanges.filter((change) => {
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          change.field.toLowerCase().includes(searchLower) ||
          change.old_value?.toLowerCase().includes(searchLower) ||
          change.new_value?.toLowerCase().includes(searchLower) ||
          change.profile?.first_name.toLowerCase().includes(searchLower) ||
          change.profile?.last_name.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      if (filters.field && filters.field !== "all" && change.field !== filters.field) {
        return false
      }

      if (filters.changed_by && filters.changed_by !== "all") {
        const changedBy = change.changed_by?.toLowerCase() || ""
        if (filters.changed_by === "user" && changedBy !== "user") return false
        if (filters.changed_by === "admin" && !changedBy.includes("@")) return false
        if (filters.changed_by === "system" && changedBy !== "system") return false
      }

      return true
    })
  }, [search, filters])

  // Stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayChanges = mockProfileChanges.filter(
    (c) => new Date(c.changed_at) >= today
  ).length
  const uniqueFields = [...new Set(mockProfileChanges.map((c) => c.field))].length
  const uniqueProfiles = [...new Set(mockProfileChanges.map((c) => c.profile_id))].length

  const stats: StatItem[] = [
    {
      label: "Total Changes",
      value: mockProfileChanges.length,
      icon: History,
    },
    {
      label: "Today",
      value: todayChanges,
      change: formatDate(today),
      changeType: "neutral",
    },
    {
      label: "Unique Fields",
      value: uniqueFields,
    },
    {
      label: "Profiles Changed",
      value: uniqueProfiles,
    },
  ]

  // Group changes by date
  const changesByDate = React.useMemo(() => {
    const grouped: Record<string, typeof mockProfileChanges> = {}
    filteredChanges.forEach((change) => {
      const date = formatDate(change.changed_at)
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(change)
    })
    return grouped
  }, [filteredChanges])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Timeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          View all profile changes across the system
        </p>
      </div>

      {/* Stats */}
      <StatsRow stats={stats} />

      {/* Filters */}
      <FilterBar
        filters={filterOptions}
        values={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        searchPlaceholder="Search changes..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Results */}
      <div className="text-sm text-gray-500">
        {filteredChanges.length} change{filteredChanges.length !== 1 ? "s" : ""} found
      </div>

      {/* Timeline by Date */}
      <div className="space-y-6">
        {Object.entries(changesByDate).map(([date, changes]) => (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                {date}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineView changes={changes} />
            </CardContent>
          </Card>
        ))}
        {filteredChanges.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No changes match your filters
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
