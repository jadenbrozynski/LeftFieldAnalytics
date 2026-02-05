"use client"

import * as React from "react"
import Link from "next/link"
import { fetchWorldDomination, CityDomination, DominationStats } from "@/lib/api"
import { StatsRow, StatItem } from "@/components/stats-row"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Globe, Users, TrendingUp, Target } from "lucide-react"
import { cn } from "@/lib/utils"

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toLocaleString()
}

function formatPenetration(rate: number): string {
  if (rate >= 0.01) {
    return `${rate.toFixed(3)}%`
  }
  if (rate >= 0.001) {
    return `${rate.toFixed(4)}%`
  }
  return `${rate.toFixed(5)}%`
}

const statusConfig: Record<
  CityDomination['status'],
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' }
> = {
  dominating: { label: 'Dominating', variant: 'success' },
  strong: { label: 'Strong', variant: 'success' },
  growing: { label: 'Growing', variant: 'warning' },
  early: { label: 'Early', variant: 'secondary' },
  starting: { label: 'Starting', variant: 'outline' },
  unknown: { label: 'Unknown', variant: 'outline' },
}

function PenetrationBar({ rate }: { rate: number | null }) {
  if (rate === null) {
    return (
      <div className="flex items-center gap-2 min-w-[140px]">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gray-200" style={{ width: '0%' }} />
        </div>
        <span className="text-xs text-gray-400 w-16 text-right">N/A</span>
      </div>
    )
  }

  // Scale the bar logarithmically for better visualization
  // Max width at 0.1% (dominating threshold)
  const maxRate = 0.1
  const percentage = Math.min((rate / maxRate) * 100, 100)

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            rate >= 0.1 && "bg-green-500",
            rate >= 0.05 && rate < 0.1 && "bg-emerald-500",
            rate >= 0.01 && rate < 0.05 && "bg-yellow-500",
            rate >= 0.001 && rate < 0.01 && "bg-orange-500",
            rate < 0.001 && "bg-gray-300"
          )}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-16 text-right">
        {formatPenetration(rate)}
      </span>
    </div>
  )
}

export default function WorldDominationPage() {
  const [cities, setCities] = React.useState<CityDomination[]>([])
  const [stats, setStats] = React.useState<DominationStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchWorldDomination()
        setCities(response.cities)
        setStats(response.stats)
      } catch (err) {
        console.error('Failed to load world domination data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const statItems: StatItem[] = stats
    ? [
        {
          label: "Total Market",
          value: formatNumber(stats.total_market),
          change: `${cities.length} cities`,
          changeType: "neutral",
          icon: Globe,
        },
        {
          label: "Total Waitlist",
          value: stats.total_waitlist.toLocaleString(),
          change: `${formatPenetration((stats.total_waitlist / stats.total_market) * 100)} overall`,
          changeType: "neutral",
          icon: Users,
        },
        {
          label: "Top City",
          value: stats.top_city ? `${stats.top_city.name}, ${stats.top_city.state}` : "-",
          change: stats.top_city
            ? `${formatPenetration(stats.top_city.penetration_rate)} penetration`
            : undefined,
          changeType: "positive",
          icon: Target,
        },
        {
          label: "Avg Penetration",
          value: formatPenetration(stats.avg_penetration),
          change: "Across all cities",
          changeType: "neutral",
          icon: TrendingUp,
        },
      ]
    : []

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">World Domination</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track waitlist penetration by city
          </p>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-700">Failed to load data: {error}</p>
            <button
              className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">World Domination</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track waitlist penetration by city population
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Population</TableHead>
                  <TableHead className="text-right">Waitlist</TableHead>
                  <TableHead>Penetration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.map((city, index) => {
                  const config = statusConfig[city.status]
                  return (
                    <TableRow key={city.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-500">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/world-domination/${city.id}`}
                          className="text-[#00433a] hover:underline"
                        >
                          {city.name}, {city.state}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {city.population ? city.population.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {city.waitlist_count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <PenetrationBar rate={city.penetration_rate} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {cities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No city data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
