"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DropWithStats } from "@/lib/types"
import { fetchDrops } from "@/lib/api"
import { DataTable, Column } from "@/components/data-table"
import { StatsRow, StatItem } from "@/components/stats-row"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, Heart, TrendingUp, GitCompare } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function DropsPage() {
  const router = useRouter()
  const [drops, setDrops] = React.useState<DropWithStats[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadDrops() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchDrops()
        setDrops(response.data)
      } catch (err) {
        console.error('Failed to load drops:', err)
        setError(err instanceof Error ? err.message : 'Failed to load drops')
      } finally {
        setLoading(false)
      }
    }

    loadDrops()
  }, [])

  // Calculate aggregate stats
  const aggregateStats = React.useMemo(() => {
    if (drops.length === 0) return null

    const totalParticipants = drops.reduce((sum, d) => sum + (d.stats?.total_participants ?? 0), 0)
    const totalMatches = drops.reduce((sum, d) => sum + (d.stats?.total_conversations ?? 0), 0)
    const avgMatchRate = drops.filter(d => d.stats).length > 0
      ? drops.reduce((sum, d) => sum + (d.stats?.match_rate ?? 0), 0) / drops.filter(d => d.stats).length
      : 0

    return {
      totalDrops: drops.length,
      totalParticipants,
      totalMatches,
      avgMatchRate,
    }
  }, [drops])

  const isDropActive = (drop: DropWithStats) => {
    const now = new Date()
    const startDate = new Date(drop.start_date)
    const endDate = new Date(drop.end_date)
    return now >= startDate && now <= endDate
  }

  const statItems: StatItem[] = aggregateStats ? [
    {
      label: "Total Drops",
      value: aggregateStats.totalDrops,
      icon: Calendar,
    },
    {
      label: "Total Participants",
      value: aggregateStats.totalParticipants,
      icon: Users,
    },
    {
      label: "Total Matches",
      value: aggregateStats.totalMatches,
      icon: Heart,
    },
    {
      label: "Avg Match Rate",
      value: `${(aggregateStats.avgMatchRate * 100).toFixed(1)}%`,
      icon: TrendingUp,
    },
  ] : []

  const columns: Column<DropWithStats>[] = [
    {
      id: "number",
      header: "Drop #",
      cell: (drop) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">#{drop.number}</span>
          {isDropActive(drop) && (
            <Badge variant="success" className="text-xs">Active</Badge>
          )}
        </div>
      ),
    },
    {
      id: "dates",
      header: "Date Range",
      cell: (drop) => (
        <span className="text-gray-600 text-sm">
          {formatDate(drop.start_date)} - {formatDate(drop.end_date)}
        </span>
      ),
    },
    {
      id: "participants",
      header: "Participants",
      cell: (drop) => (
        <span className="text-gray-900 font-medium">
          {drop.stats?.total_participants?.toLocaleString() ?? '—'}
        </span>
      ),
    },
    {
      id: "matches",
      header: "Matches",
      cell: (drop) => (
        <span className="text-gray-900 font-medium">
          {drop.stats?.total_conversations?.toLocaleString() ?? '—'}
        </span>
      ),
    },
    {
      id: "matchRate",
      header: "Match Rate",
      cell: (drop) => (
        <span className="text-gray-900 font-medium">
          {drop.stats ? `${(drop.stats.match_rate * 100).toFixed(1)}%` : '—'}
        </span>
      ),
    },
    {
      id: "unmatchRate",
      header: "Unmatch Rate",
      cell: (drop) => (
        <span className={drop.stats && drop.stats.unmatch_rate > 0.1 ? "text-red-600" : "text-gray-600"}>
          {drop.stats ? `${(drop.stats.unmatch_rate * 100).toFixed(1)}%` : '—'}
        </span>
      ),
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Drops</h1>
          <p className="text-sm text-gray-500 mt-1">
            Match drop performance analytics
          </p>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-700">Failed to load drops: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Drops</h1>
          <p className="text-sm text-gray-500 mt-1">
            Match drop performance analytics
          </p>
        </div>
        {drops.length >= 2 && (
          <Button asChild>
            <Link href="/drops/compare">
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Drops
            </Link>
          </Button>
        )}
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

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          `${drops.length} drop${drops.length !== 1 ? "s" : ""} found`
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-6 w-12" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={drops}
          onRowClick={(drop) => router.push(`/drops/${drop.id}`)}
          emptyMessage="No drops found."
        />
      )}
    </div>
  )
}
