"use client"

import * as React from "react"
import { Profile, WaitlistCity } from "@/lib/types"
import { fetchWaitlist, fetchWaitlistCities, WaitlistStats } from "@/lib/api"
import { FilterBar, FilterOption } from "@/components/filter-bar"
import { DataTable, Column } from "@/components/data-table"
import { ProfileView } from "@/components/profile-view"
import { StatsRow, StatItem } from "@/components/stats-row"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Users, MapPin, CheckCircle } from "lucide-react"
import { formatRelativeTime, getGenderLabel, formatPhoneNumber } from "@/lib/utils"

export default function WaitlistPage() {
  const [profiles, setProfiles] = React.useState<Profile[]>([])
  const [cities, setCities] = React.useState<WaitlistCity[]>([])
  const [stats, setStats] = React.useState<WaitlistStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [selectedProfile, setSelectedProfile] = React.useState<Profile | null>(null)
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

  // Load cities on mount
  React.useEffect(() => {
    fetchWaitlistCities()
      .then(res => setCities(res.data))
      .catch(err => console.error('Failed to load cities:', err))
  }, [])

  // Load waitlist when filters change
  React.useEffect(() => {
    async function loadWaitlist() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchWaitlist({
          search: debouncedSearch,
          gender: filters.gender,
          city: filters.city,
          needs_review: filters.needs_review,
          page: pagination.page,
          per_page: pagination.per_page,
        })

        setProfiles(response.data)
        setStats(response.stats)
        setPagination(response.pagination)
      } catch (err) {
        console.error('Failed to load waitlist:', err)
        setError(err instanceof Error ? err.message : 'Failed to load waitlist')
      } finally {
        setLoading(false)
      }
    }

    loadWaitlist()
  }, [debouncedSearch, filters, pagination.page, pagination.per_page])

  const filterOptions: FilterOption[] = [
    {
      id: "gender",
      label: "Gender",
      type: "select",
      options: [
        { value: "man", label: "Man" },
        { value: "woman", label: "Woman" },
        { value: "nonbinary", label: "Non-binary" },
      ],
    },
    {
      id: "city",
      label: "City",
      type: "select",
      options: cities.map((city) => ({
        value: city.id,
        label: `${city.name}, ${city.state}`,
      })),
    },
    {
      id: "needs_review",
      label: "Review Status",
      type: "select",
      options: [
        { value: "true", label: "Needs Review" },
        { value: "false", label: "Reviewed" },
      ],
    },
  ]

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
      label: "Total Waitlisted",
      value: stats.total,
      icon: Clock,
    },
    {
      label: "Needs Review",
      value: stats.needs_review,
      change: stats.needs_review > 0 ? "Action needed" : "All clear",
      changeType: stats.needs_review > 0 ? "negative" : "positive",
      icon: Users,
    },
    {
      label: "Top City",
      value: stats.top_city?.name || "-",
      change: stats.top_city ? `${stats.top_city.count} users` : undefined,
      changeType: "neutral",
      icon: MapPin,
    },
    {
      label: "Approved Today",
      value: "-",
      change: "Feature coming soon",
      changeType: "neutral",
      icon: CheckCircle,
    },
  ] : []

  const columns: Column<Profile>[] = [
    {
      id: "user",
      header: "User",
      cell: (profile) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {profile.uploads[0] ? (
              <AvatarImage src={profile.uploads[0].url} />
            ) : null}
            <AvatarFallback className="text-sm">
              {profile.first_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">
              {profile.first_name} {profile.last_name}
            </div>
            <div className="text-xs text-gray-500">{formatPhoneNumber(profile.user.phone)}</div>
          </div>
        </div>
      ),
    },
    {
      id: "gender",
      header: "Gender",
      cell: (profile) => (
        <span className="text-gray-600">{getGenderLabel(profile.gender)}</span>
      ),
    },
    {
      id: "age",
      header: "Age",
      sortable: true,
      cell: (profile) => <span className="text-gray-600">{profile.age}</span>,
    },
    {
      id: "city",
      header: "Waitlist City",
      cell: (profile) => {
        const city = cities.find((c) => c.id === profile.waitlist_city_id)
        return (
          <span className="text-gray-600">
            {city ? `${city.name}, ${city.state}` : profile.waitlist_city ? `${profile.waitlist_city.name}, ${profile.waitlist_city.state}` : "-"}
          </span>
        )
      },
    },
    {
      id: "review",
      header: "Review",
      cell: (profile) => (
        profile.needs_manual_review ? (
          <Badge variant="warning">Needs Review</Badge>
        ) : (
          <Badge variant="secondary">Ready</Badge>
        )
      ),
    },
    {
      id: "joined",
      header: "Joined",
      sortable: true,
      cell: (profile) => (
        <span className="text-gray-500 text-sm">
          {formatRelativeTime(profile.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (profile) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            disabled
            title="READ-ONLY mode"
            onClick={() => {
              console.log("Approve:", profile.id)
            }}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled
            title="READ-ONLY mode"
            onClick={() => {
              console.log("Reject:", profile.id)
            }}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Waitlist</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage users waiting to join the app
          </p>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-700">Failed to load waitlist: {error}</p>
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
        <h1 className="text-2xl font-semibold text-gray-900">Waitlist</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage users waiting to join the app
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
        searchPlaceholder="Search by name or phone..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Results */}
      <div className="text-sm text-gray-500">
        {loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          `${pagination.total} user${pagination.total !== 1 ? "s" : ""} on waitlist`
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
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={profiles}
          onRowClick={(profile) => setSelectedProfile(profile)}
          emptyMessage="No waitlisted profiles match your filters."
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

      {/* Profile Sheet */}
      <Sheet open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Profile Details</SheetTitle>
          </SheetHeader>
          {selectedProfile && (
            <div className="mt-6">
              <ProfileView
                profile={selectedProfile}
                onStatusChange={(status) => {
                  console.log("Status change:", status)
                  // READ-ONLY: No status changes
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
