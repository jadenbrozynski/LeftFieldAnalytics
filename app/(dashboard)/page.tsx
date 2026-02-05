"use client"

import * as React from "react"
import Link from "next/link"
import { Users, Clock, Flag, Activity } from "lucide-react"
import { StatsRow, StatItem } from "@/components/stats-row"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fetchDashboardStats,
  fetchRecentProfiles,
  fetchUnresolvedReports,
} from "@/lib/api"
import { DashboardStats, Profile, ProfileReport } from "@/lib/types"
import { formatRelativeTime, getStatusColor } from "@/lib/utils"

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [recentProfiles, setRecentProfiles] = React.useState<Profile[]>([])
  const [unresolvedReports, setUnresolvedReports] = React.useState<ProfileReport[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const [statsData, profiles, reports] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentProfiles(5),
          fetchUnresolvedReports(5),
        ])

        setStats(statsData)
        setRecentProfiles(profiles)
        setUnresolvedReports(reports)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const statItems: StatItem[] = stats ? [
    {
      label: "Total Users",
      value: stats.total_users,
      change: `+${stats.new_users_week} this week`,
      changeType: "positive",
      icon: Users,
    },
    {
      label: "Live Profiles",
      value: stats.live_profiles,
      change: stats.total_users > 0
        ? `${Math.round((stats.live_profiles / stats.total_users) * 100)}% of total`
        : "0% of total",
      changeType: "neutral",
      icon: Activity,
    },
    {
      label: "Waitlisted",
      value: stats.waitlisted_profiles,
      change: stats.total_users > 0
        ? `${Math.round((stats.waitlisted_profiles / stats.total_users) * 100)}% of total`
        : "0% of total",
      changeType: "neutral",
      icon: Clock,
    },
    {
      label: "Pending Reports",
      value: stats.pending_reports,
      change: stats.pending_reports > 0 ? "Needs attention" : "All clear",
      changeType: stats.pending_reports > 0 ? "negative" : "positive",
      icon: Flag,
    },
  ] : []

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of LeftField app statistics and activity
          </p>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-700">Failed to load dashboard data: {error}</p>
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
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of LeftField app statistics and activity
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

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Profiles */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium text-gray-900">Recent Profiles</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-900">
              <Link href="/profiles">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentProfiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No profiles yet</p>
            ) : (
              <div className="space-y-4">
                {recentProfiles.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/profiles/${profile.id}`}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      {profile.uploads[0] ? (
                        <AvatarImage src={profile.uploads[0].url} />
                      ) : null}
                      <AvatarFallback className="bg-[#00433a]/10 text-[#00433a]">
                        {profile.first_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {profile.first_name} {profile.last_name}
                        </span>
                        <Badge className={getStatusColor(profile.status)} variant="secondary">
                          {profile.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {profile.geolocation?.city || profile.neighborhood || "Unknown"} • {profile.age} years old
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(profile.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reports */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium text-gray-900">
              Pending Reports
              {unresolvedReports.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unresolvedReports.length}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-900">
              <Link href="/reports">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : unresolvedReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Flag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No pending reports</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unresolvedReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/reports/${report.id}`}
                    className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      {report.reported.uploads?.[0] ? (
                        <AvatarImage src={report.reported.uploads[0].url} />
                      ) : null}
                      <AvatarFallback className="bg-[#00433a]/10 text-[#00433a]">
                        {report.reported.first_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">
                          {report.reported.first_name} {report.reported.last_name}
                        </span>
                        <Badge variant="warning">Unresolved</Badge>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {report.reporter_notes || "No notes provided"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Reported by {report.reporter?.first_name || "System"} •{" "}
                        {formatRelativeTime(report.created_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity - Timeline placeholder */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium text-gray-900">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-900">
              <Link href="/timeline">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Activity timeline coming soon</p>
              <p className="text-xs text-gray-400 mt-1">
                Profile change history is not available in the current database schema
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
