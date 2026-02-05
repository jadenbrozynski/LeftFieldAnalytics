"use client"

import * as React from "react"
import Link from "next/link"
import { ProfileReport } from "@/lib/types"
import { fetchReports, ReportsStats } from "@/lib/api"
import { FilterBar, FilterOption } from "@/components/filter-bar"
import { DataTable, Column } from "@/components/data-table"
import { StatsRow, StatItem } from "@/components/stats-row"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Flag, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import { formatRelativeTime, formatPhoneNumber } from "@/lib/utils"

const filterOptions: FilterOption[] = [
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "unresolved", label: "Unresolved" },
      { value: "resolved", label: "Resolved" },
    ],
  },
  {
    id: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "user", label: "User Report" },
      { value: "system", label: "System Flagged" },
    ],
  },
]

export default function ReportsPage() {
  const [reports, setReports] = React.useState<ProfileReport[]>([])
  const [stats, setStats] = React.useState<ReportsStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [pagination, setPagination] = React.useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  })

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Load reports when filters change
  React.useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchReports({
          search: debouncedSearch,
          status: filters.status,
          type: filters.type,
          page: pagination.page,
          per_page: pagination.per_page,
        })

        setReports(response.data)
        setStats(response.stats)
        setPagination(response.pagination)
      } catch (err) {
        console.error('Failed to load reports:', err)
        setError(err instanceof Error ? err.message : 'Failed to load reports')
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [debouncedSearch, filters, pagination.page, pagination.per_page])

  const handleFilterChange = (id: string, value: string) => {
    setFilters((prev) => ({ ...prev, [id]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearch("")
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const statItems: StatItem[] = stats ? [
    {
      label: "Total Reports",
      value: stats.total,
      icon: Flag,
    },
    {
      label: "Unresolved",
      value: stats.unresolved,
      change: stats.unresolved > 0 ? "Needs attention" : "All clear",
      changeType: stats.unresolved > 0 ? "negative" : "positive",
      icon: AlertTriangle,
    },
    {
      label: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
    },
    {
      label: "System Flagged",
      value: stats.system_flagged,
      icon: Clock,
    },
  ] : []

  const columns: Column<ProfileReport>[] = [
    {
      id: "reported",
      header: "Reported User",
      cell: (report) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {report.reported.uploads?.[0] ? (
              <AvatarImage src={report.reported.uploads[0].url} />
            ) : null}
            <AvatarFallback className="text-sm">
              {report.reported.first_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">
              {report.reported.first_name} {report.reported.last_name}
            </div>
            <div className="text-xs text-gray-500">
              {report.reported.user?.phone ? formatPhoneNumber(report.reported.user.phone) : "Unknown"}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "reporter",
      header: "Reported By",
      cell: (report) => (
        report.reporter ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              {report.reporter.uploads?.[0] ? (
                <AvatarImage src={report.reporter.uploads[0].url} />
              ) : null}
              <AvatarFallback className="text-xs">
                {report.reporter.first_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">
              {report.reporter.first_name}
            </span>
          </div>
        ) : (
          <Badge variant="outline">System</Badge>
        )
      ),
    },
    {
      id: "reason",
      header: "Reason",
      cell: (report) => (
        <span className="text-sm text-gray-600 line-clamp-2 max-w-xs">
          {report.reporter_notes || "No notes provided"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (report) => (
        report.is_resolved ? (
          <Badge variant="success">Resolved</Badge>
        ) : (
          <Badge variant="warning">Unresolved</Badge>
        )
      ),
    },
    {
      id: "date",
      header: "Date",
      sortable: true,
      cell: (report) => (
        <span className="text-gray-500 text-sm">
          {formatRelativeTime(report.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (report) => (
        <Button size="sm" variant="outline" asChild>
          <Link href={`/reports/${report.id}`}>View</Link>
        </Button>
      ),
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage user reports
          </p>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-700">Failed to load reports: {error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and manage user reports
          <Badge variant="outline" className="ml-2">READ-ONLY</Badge>
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StatsRow stats={statItems} />
      )}

      {/* Filters */}
      <FilterBar
        filters={filterOptions}
        values={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        searchPlaceholder="Search reports..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Results */}
      <div className="text-sm text-gray-500">
        {loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          `${pagination.total} report${pagination.total !== 1 ? "s" : ""} found`
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={reports}
          emptyMessage="No reports match your filters."
        />
      )}

      {/* Pagination */}
      {!loading && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.total_pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
