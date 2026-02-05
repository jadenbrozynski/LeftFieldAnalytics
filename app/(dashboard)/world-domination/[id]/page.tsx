"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Users, MapPin, TrendingUp, Search } from "lucide-react"
import { fetchCityDetail, CityDetailResponse } from "@/lib/api"
import { Profile } from "@/lib/types"
import { ProfileView } from "@/components/profile-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { DataTable, Column } from "@/components/data-table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { StatsRow, StatItem } from "@/components/stats-row"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, getStatusColor, getGenderLabel, formatPhoneNumber } from "@/lib/utils"

function formatNumber(num: number): string {
  return num.toLocaleString()
}

function formatPenetration(rate: number | null): string {
  if (rate === null) return "N/A"
  if (rate >= 0.01) return `${rate.toFixed(3)}%`
  if (rate >= 0.001) return `${rate.toFixed(4)}%`
  return `${rate.toFixed(5)}%`
}

export default function CityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cityId = params.id as string

  const [data, setData] = React.useState<CityDetailResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = React.useState<Profile | null>(null)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Load city data
  React.useEffect(() => {
    async function loadCity() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchCityDetail(cityId, debouncedSearch)
        setData(response)
      } catch (err) {
        console.error('Failed to load city:', err)
        setError(err instanceof Error ? err.message : 'Failed to load city')
      } finally {
        setLoading(false)
      }
    }

    loadCity()
  }, [cityId, debouncedSearch])

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
            <AvatarFallback className="text-sm bg-gray-100">
              {profile.first_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">
              {profile.first_name} {profile.last_name}
            </div>
            <div className="text-xs text-gray-500">
              {formatPhoneNumber(profile.user.phone)}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
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
      cell: (profile) => <span className="text-gray-600">{profile.age}</span>,
    },
    {
      id: "details",
      header: "Details",
      cell: (profile) => (
        <span className="text-gray-600 text-sm">
          {profile.job_title || profile.school || profile.neighborhood || "—"}
        </span>
      ),
    },
    {
      id: "created_at",
      header: "Signed Up",
      cell: (profile) => (
        <span className="text-gray-500 text-sm">
          {formatDate(profile.created_at)}
        </span>
      ),
    },
  ]

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" disabled>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to World Domination
        </Button>

        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-medium text-gray-900">
          {error === 'City not found' ? 'City not found' : 'Error loading city'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {error || "An unexpected error occurred."}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    )
  }

  const { city, profiles, stats } = data

  const statItems: StatItem[] = [
    {
      label: "Population",
      value: city.population ? formatNumber(city.population) : "—",
      icon: MapPin,
    },
    {
      label: "Total Signups",
      value: stats.total,
      icon: Users,
    },
    {
      label: "Waitlisted",
      value: stats.waitlisted,
      change: `${Math.round((stats.waitlisted / stats.total) * 100)}% of signups`,
      changeType: "neutral",
    },
    {
      label: "Penetration",
      value: formatPenetration(city.penetration_rate),
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/world-domination">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to World Domination
        </Link>
      </Button>

      {/* City Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {city.name}, {city.state}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {stats.total} total signups from this city
        </p>
      </div>

      {/* Stats */}
      <StatsRow stats={statItems} />

      {/* Gender Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gender Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div>
              <span className="text-2xl font-semibold">{stats.gender_breakdown.woman}</span>
              <p className="text-sm text-gray-500">Women</p>
            </div>
            <div>
              <span className="text-2xl font-semibold">{stats.gender_breakdown.man}</span>
              <p className="text-sm text-gray-500">Men</p>
            </div>
            <div>
              <span className="text-2xl font-semibold">{stats.gender_breakdown.nonbinary}</span>
              <p className="text-sm text-gray-500">Non-binary</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Profiles Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Profiles {debouncedSearch && `(${profiles.length} matching)`}
            </CardTitle>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, phone, email, job, school..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {debouncedSearch
                ? "No profiles match your search"
                : "No profiles signed up from this city yet"}
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={profiles}
              onRowClick={(profile) => setSelectedProfile(profile)}
              emptyMessage="No profiles found"
            />
          )}
        </CardContent>
      </Card>

      {/* Profile Sheet - Using ProfileView component */}
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
