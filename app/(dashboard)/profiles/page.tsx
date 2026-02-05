"use client"

import * as React from "react"
import { Profile, WaitlistCity } from "@/lib/types"
import { fetchProfiles, fetchWaitlistCities } from "@/lib/api"
import { FilterBar, FilterOption } from "@/components/filter-bar"
import { DataTable, Column } from "@/components/data-table"
import { ProfileView } from "@/components/profile-view"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatRelativeTime, getStatusColor, getGenderLabel, formatPhoneNumber } from "@/lib/utils"

export default function ProfilesPage() {
  const [profiles, setProfiles] = React.useState<Profile[]>([])
  const [cities, setCities] = React.useState<WaitlistCity[]>([])
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

  // Load profiles when filters change
  React.useEffect(() => {
    async function loadProfiles() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchProfiles({
          search: debouncedSearch,
          status: filters.status,
          gender: filters.gender,
          city: filters.city,
          last_seen: filters.last_seen,
          page: pagination.page,
          per_page: pagination.per_page,
        })

        setProfiles(response.data)
        setPagination(response.pagination)
      } catch (err) {
        console.error('Failed to load profiles:', err)
        setError(err instanceof Error ? err.message : 'Failed to load profiles')
      } finally {
        setLoading(false)
      }
    }

    loadProfiles()
  }, [debouncedSearch, filters, pagination.page, pagination.per_page])

  const filterOptions: FilterOption[] = [
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "live", label: "Live" },
        { value: "waitlisted", label: "Waitlisted" },
        { value: "banned", label: "Banned" },
        { value: "deleted", label: "Deleted" },
        { value: "pending_delete", label: "Pending Delete" },
      ],
    },
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
      id: "last_seen",
      label: "Last Seen",
      type: "select",
      options: [
        { value: "24h", label: "Last 24 hours" },
        { value: "7d", label: "Last 7 days" },
        { value: "30d", label: "Last 30 days" },
        { value: "90d", label: "Last 90 days" },
        { value: "never", label: "Never" },
      ],
    },
  ]

  const handleFilterChange = (id: string, value: string) => {
    setFilters((prev) => ({ ...prev, [id]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearch("")
    setPagination(prev => ({ ...prev, page: 1 }))
  }

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
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {profile.first_name} {profile.last_name}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {profile.user.last_seen_at
                  ? formatRelativeTime(profile.user.last_seen_at)
                  : "Never"}
              </span>
            </div>
            <div className="text-xs text-gray-500">{formatPhoneNumber(profile.user.phone)}</div>
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (profile) => (
        <Badge className={getStatusColor(profile.status)}>{profile.status}</Badge>
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
      id: "location",
      header: "Location",
      cell: (profile) => (
        <span className="text-gray-600">
          {profile.geolocation?.city || profile.neighborhood || "-"}
        </span>
      ),
    },
    {
      id: "created_at",
      header: "Joined",
      sortable: true,
      cell: (profile) => (
        <span className="text-gray-500 text-sm">
          {formatDate(profile.created_at)}
        </span>
      ),
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Profiles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search and manage user profiles
          </p>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-700">Failed to load profiles: {error}</p>
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
        <h1 className="text-2xl font-semibold text-gray-900">Profiles</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search and manage user profiles
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filterOptions}
        values={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        searchPlaceholder="Search by name, phone, or email..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          `${pagination.total} profile${pagination.total !== 1 ? "s" : ""} found`
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
          emptyMessage="No profiles match your filters."
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
                showFullProfileLink
                showActions={false}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
