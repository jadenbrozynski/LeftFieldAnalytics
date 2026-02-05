"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Users, Heart, TrendingUp, TrendingDown, UserMinus, Send, Inbox, HeartOff, MessageSquare, ArrowRight, GitCompare } from "lucide-react"
import { fetchDrop, fetchDrops, fetchDropMatches, fetchDropRequests, DropMatchesResponse, DropRequestsResponse } from "@/lib/api"
import { DropWithStats } from "@/lib/types"
import { GenderBreakdown } from "@/components/gender-breakdown"
import { DropMatchesTable } from "@/components/drop-matches-table"
import { DropRequestsTable } from "@/components/drop-requests-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

export default function DropDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dropId = params.id as string

  const [drop, setDrop] = React.useState<DropWithStats | null>(null)
  const [allDrops, setAllDrops] = React.useState<DropWithStats[]>([])
  const [compareDropId, setCompareDropId] = React.useState<string | null>(null)
  const [matchesData, setMatchesData] = React.useState<DropMatchesResponse | null>(null)
  const [requestsData, setRequestsData] = React.useState<DropRequestsResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [matchesLoading, setMatchesLoading] = React.useState(false)
  const [requestsLoading, setRequestsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("overview")
  const [matchFilter, setMatchFilter] = React.useState<'all' | 'active' | 'unmatched'>('all')

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const [dropData, dropsData] = await Promise.all([
          fetchDrop(dropId),
          fetchDrops(),
        ])
        setDrop(dropData)
        setAllDrops(dropsData.data)

        // Auto-select previous drop for comparison if available
        const currentIndex = dropsData.data.findIndex(d => d.id === dropId)
        if (currentIndex > -1 && currentIndex < dropsData.data.length - 1) {
          setCompareDropId(dropsData.data[currentIndex + 1].id)
        }
      } catch (err) {
        console.error('Failed to load drop:', err)
        setError(err instanceof Error ? err.message : 'Failed to load drop')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dropId])

  const compareDrop = React.useMemo(() => {
    if (!compareDropId) return null
    return allDrops.find(d => d.id === compareDropId) || null
  }, [compareDropId, allDrops])

  const otherDrops = React.useMemo(() => {
    return allDrops.filter(d => d.id !== dropId)
  }, [allDrops, dropId])

  React.useEffect(() => {
    if (activeTab === 'matches' && !matchesData && !matchesLoading) {
      setMatchesLoading(true)
      fetchDropMatches(dropId)
        .then(setMatchesData)
        .catch(err => console.error('Failed to load matches:', err))
        .finally(() => setMatchesLoading(false))
    }
  }, [activeTab, dropId, matchesData, matchesLoading])

  React.useEffect(() => {
    if (activeTab === 'requests' && !requestsData && !requestsLoading) {
      setRequestsLoading(true)
      fetchDropRequests(dropId)
        .then(setRequestsData)
        .catch(err => console.error('Failed to load requests:', err))
        .finally(() => setRequestsLoading(false))
    }
  }, [activeTab, dropId, requestsData, requestsLoading])

  const getDropStatus = (drop: DropWithStats) => {
    const now = new Date()
    const startDate = new Date(drop.start_date)
    const endDate = new Date(drop.end_date)

    if (now < startDate) return 'upcoming'
    if (now > endDate) return 'completed'
    return 'active'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" disabled>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to drops
        </Button>
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !drop) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-medium text-gray-900">
          {error === 'Drop not found' ? 'Drop not found' : 'Error loading drop'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    )
  }

  const status = getDropStatus(drop)
  const stats = drop.stats

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/drops">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to drops
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">Drop #{drop.number}</h1>
            <Badge
              variant={status === 'active' ? 'success' : status === 'upcoming' ? 'secondary' : 'outline'}
              className="capitalize"
            >
              {status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(drop.start_date)} — {formatDate(drop.end_date)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches" className="gap-1.5">
            <Heart className="h-4 w-4" />
            Matches
            {matchesData && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{matchesData.stats.total}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            <Send className="h-4 w-4" />
            Requests
            {requestsData && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{requestsData.stats.total}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {!stats ? (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-6">
                <p className="text-yellow-700">No statistics available for this drop yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Comparison Selector */}
              {otherDrops.length > 0 && (
                <Card className="bg-white border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GitCompare className="h-4 w-4" />
                          <span>Compare with:</span>
                        </div>
                        <Select
                          value={compareDropId || "none"}
                          onValueChange={(val) => setCompareDropId(val === "none" ? null : val)}
                        >
                          <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Select a drop" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No comparison</SelectItem>
                            {otherDrops.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                Drop #{d.number} ({formatDate(d.start_date)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {compareDrop && (
                          <span className="text-xs text-gray-400">
                            vs Drop #{compareDrop.number}
                          </span>
                        )}
                      </div>
                      {compareDrop && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/drops/compare?drop1=${dropId}&drop2=${compareDrop.id}`}>
                            <GitCompare className="h-4 w-4 mr-1.5" />
                            Full Comparison View
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                  label="Participants"
                  value={stats.total_participants}
                  compareValue={compareDrop?.stats?.total_participants}
                  icon={Users}
                />
                <StatCard
                  label="Matches"
                  value={stats.total_conversations}
                  compareValue={compareDrop?.stats?.total_conversations}
                  icon={Heart}
                  color="pink"
                />
                <StatCard
                  label="Match Rate"
                  value={`${(stats.match_rate * 100).toFixed(1)}%`}
                  rawValue={stats.match_rate * 100}
                  compareValue={compareDrop?.stats ? compareDrop.stats.match_rate * 100 : undefined}
                  icon={TrendingUp}
                  color="green"
                  isPercent
                />
                <StatCard
                  label="Unmatch Rate"
                  value={`${(stats.unmatch_rate * 100).toFixed(1)}%`}
                  rawValue={stats.unmatch_rate * 100}
                  compareValue={compareDrop?.stats ? compareDrop.stats.unmatch_rate * 100 : undefined}
                  icon={TrendingDown}
                  color="red"
                  isPercent
                  invertTrend
                />
              </div>

              {/* Gender Breakdown */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Participants by Gender</h3>
                <GenderBreakdown
                  men={stats.men_participants}
                  women={stats.women_participants}
                  nonbinary={stats.nonbinary_participants}
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Activity Metrics */}
                <Card className="bg-white">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Activity</h3>
                    <div className="space-y-4">
                      <MetricRow label="Total Requests Sent" value={stats.total_match_requests} icon={Send} />
                      <MetricRow label="Unique Senders" value={stats.unique_request_senders} icon={Users} />
                      <MetricRow label="Avg Candidates/User" value={stats.avg_candidates_per_participant.toFixed(1)} icon={Inbox} />
                      <MetricRow label="Accounts Deleted" value={stats.total_accounts_deleted} icon={UserMinus} />
                    </div>
                  </CardContent>
                </Card>

                {/* Gender Activity Comparison */}
                <Card className="bg-white">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Avg Activity by Gender</h3>
                    <div className="space-y-3">
                      <GenderMetricRow
                        label="Candidates Shown"
                        women={stats.women_avg_candidates_shown}
                        men={stats.men_avg_candidates_shown}
                        nonbinary={stats.nonbinary_avg_candidates_shown}
                      />
                      <GenderMetricRow
                        label="Requests Sent"
                        women={stats.women_avg_requests_sent}
                        men={stats.men_avg_requests_sent}
                        nonbinary={stats.nonbinary_avg_requests_sent}
                      />
                      <GenderMetricRow
                        label="Requests Received"
                        women={stats.women_avg_requests_received}
                        men={stats.men_avg_requests_received}
                        nonbinary={stats.nonbinary_avg_requests_received}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Conversion Funnel */}
              <Card className="bg-white">
                <CardContent className="p-5">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Conversion Funnel</h3>
                  <div className="flex items-center justify-between">
                    <FunnelStep label="Candidates" value={stats.total_candidates_shown} />
                    <FunnelArrow rate={(stats.total_match_requests / stats.total_candidates_shown) * 100} />
                    <FunnelStep label="Requests" value={stats.total_match_requests} />
                    <FunnelArrow rate={(stats.total_conversations / stats.total_match_requests) * 100} />
                    <FunnelStep label="Matches" value={stats.total_conversations} highlight />
                    <FunnelArrow rate={(stats.total_unmatches / stats.total_conversations) * 100} negative />
                    <FunnelStep label="Unmatches" value={stats.total_unmatches} negative />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Metrics */}
              {(stats.unique_match_participants !== undefined ||
                stats.like_match_ratio !== undefined ||
                stats.active_user_match_rate !== undefined) && (
                <div className="grid gap-4 md:grid-cols-3">
                  {stats.unique_match_participants !== undefined && (
                    <StatCard
                      label="Unique Match Participants"
                      value={stats.unique_match_participants}
                      compareValue={compareDrop?.stats?.unique_match_participants}
                      icon={Users}
                    />
                  )}
                  {stats.like_match_ratio !== undefined && (
                    <StatCard
                      label="Like-to-Match Ratio"
                      value={stats.like_match_ratio.toFixed(1)}
                      rawValue={stats.like_match_ratio}
                      compareValue={compareDrop?.stats?.like_match_ratio}
                      icon={Heart}
                    />
                  )}
                  {stats.active_user_match_rate !== undefined && (
                    <StatCard
                      label="Active User Match Rate"
                      value={`${(stats.active_user_match_rate * 100).toFixed(1)}%`}
                      rawValue={stats.active_user_match_rate * 100}
                      compareValue={compareDrop?.stats?.active_user_match_rate !== undefined ? compareDrop.stats.active_user_match_rate * 100 : undefined}
                      icon={TrendingUp}
                      color="green"
                      isPercent
                    />
                  )}
                </div>
              )}

              {/* Side-by-side Comparison Table */}
              {compareDrop?.stats && (
                <Card className="bg-white">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
                      <GitCompare className="h-4 w-4" />
                      Drop #{drop.number} vs Drop #{compareDrop.number} Comparison
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium text-gray-600">Metric</th>
                            <th className="text-right py-2 font-medium text-gray-600">Drop #{drop.number}</th>
                            <th className="text-right py-2 font-medium text-gray-600">Drop #{compareDrop.number}</th>
                            <th className="text-right py-2 font-medium text-gray-600">Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <ComparisonRow label="Participants" current={stats.total_participants} previous={compareDrop.stats.total_participants} />
                          <ComparisonRow label="Matches" current={stats.total_conversations} previous={compareDrop.stats.total_conversations} />
                          <ComparisonRow label="Match Rate" current={stats.match_rate * 100} previous={compareDrop.stats.match_rate * 100} isPercent />
                          <ComparisonRow label="Unmatch Rate" current={stats.unmatch_rate * 100} previous={compareDrop.stats.unmatch_rate * 100} isPercent invertTrend />
                          <ComparisonRow label="Total Requests" current={stats.total_match_requests} previous={compareDrop.stats.total_match_requests} />
                          <ComparisonRow label="Unique Senders" current={stats.unique_request_senders} previous={compareDrop.stats.unique_request_senders} />
                          <ComparisonRow label="Avg Candidates/User" current={stats.avg_candidates_per_participant} previous={compareDrop.stats.avg_candidates_per_participant} decimals={1} />
                          <ComparisonRow label="Women" current={stats.women_participants} previous={compareDrop.stats.women_participants} />
                          <ComparisonRow label="Men" current={stats.men_participants} previous={compareDrop.stats.men_participants} />
                          <ComparisonRow label="Non-binary" current={stats.nonbinary_participants} previous={compareDrop.stats.nonbinary_participants} />
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-6 mt-6">
          {matchesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : matchesData ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <MiniStatCard label="Total" value={matchesData.stats.total} icon={Heart} />
                <MiniStatCard label="Active" value={matchesData.stats.active} icon={Heart} color="green" />
                <MiniStatCard label="Unmatched" value={matchesData.stats.unmatched} icon={HeartOff} color="red" />
                <MiniStatCard label="With Messages" value={matchesData.stats.with_messages} icon={MessageSquare} color="blue" />
              </div>

              <div className="flex gap-2">
                {(['all', 'active', 'unmatched'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={matchFilter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMatchFilter(f)}
                  >
                    {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Unmatched'}
                    <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                      {f === 'all' ? matchesData.stats.total : f === 'active' ? matchesData.stats.active : matchesData.stats.unmatched}
                    </Badge>
                  </Button>
                ))}
              </div>

              <DropMatchesTable matches={matchesData.data} filter={matchFilter} />
            </>
          ) : (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-6">
                <p className="text-red-700">Failed to load matches.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6 mt-6">
          {requestsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : requestsData ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <MiniStatCard label="Total" value={requestsData.stats.total} icon={Send} />
                {Object.entries(requestsData.stats.by_status).slice(0, 3).map(([status, count]) => (
                  <MiniStatCard key={status} label={status} value={count} icon={Send} />
                ))}
              </div>
              <DropRequestsTable requests={requestsData.data} />
            </>
          ) : (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-6">
                <p className="text-red-700">Failed to load requests.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper to calculate percentage change
function calcChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

// Stat Card Component
function StatCard({ label, value, rawValue, compareValue, icon: Icon, color, isPercent, invertTrend }: {
  label: string
  value: string | number
  rawValue?: number
  compareValue?: number
  icon: React.ElementType
  color?: 'pink' | 'green' | 'red' | 'blue'
  isPercent?: boolean
  invertTrend?: boolean
}) {
  const colorClasses = {
    pink: 'bg-pink-50 text-pink-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  }

  // Calculate trend
  const currentNum = rawValue ?? (typeof value === 'number' ? value : 0)
  const change = compareValue !== undefined ? calcChange(currentNum, compareValue) : null
  const hasChange = change !== null && isFinite(change)

  // For percent metrics, show absolute difference instead of percentage change
  const displayChange = isPercent && compareValue !== undefined
    ? currentNum - compareValue
    : change

  // Determine if this is a positive or negative trend
  let isPositive = hasChange && change > 0
  if (invertTrend) isPositive = !isPositive

  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {hasChange && displayChange !== null && (
              <div className={cn(
                "flex items-center gap-1 mt-1 text-xs font-medium",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {displayChange > 0 ? '+' : ''}{isPercent ? displayChange.toFixed(1) + ' pts' : change?.toFixed(1) + '%'}
                </span>
              </div>
            )}
          </div>
          <div className={cn("rounded-lg p-2.5", color ? colorClasses[color] : "bg-gray-100 text-gray-600")}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mini Stat Card for tabs
function MiniStatCard({ label, value, icon: Icon, color }: {
  label: string
  value: number
  icon: React.ElementType
  color?: 'green' | 'red' | 'blue'
}) {
  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={cn("h-5 w-5", color ? colorClasses[color] : "text-gray-400")} />
        <div>
          <p className="text-xs text-gray-500 capitalize">{label}</p>
          <p className="text-lg font-semibold">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Metric Row
function MetricRow({ label, value, icon: Icon }: {
  label: string
  value: string | number
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-600">
        <Icon className="h-4 w-4 text-gray-400" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium">{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </div>
  )
}

// Gender Metric Row
function GenderMetricRow({ label, women, men, nonbinary }: {
  label: string
  women: number
  men: number
  nonbinary: number
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-4 text-sm font-medium">
        <span className="text-pink-600">{women.toFixed(1)}</span>
        <span className="text-blue-600">{men.toFixed(1)}</span>
        <span className="text-purple-600">{nonbinary.toFixed(1)}</span>
      </div>
    </div>
  )
}

// Funnel Step
function FunnelStep({ label, value, highlight, negative }: {
  label: string
  value: number
  highlight?: boolean
  negative?: boolean
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={cn(
        "text-xl font-semibold",
        negative ? "text-red-600" : highlight ? "text-green-600" : "text-gray-900"
      )}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}

// Funnel Arrow
function FunnelArrow({ rate, negative }: { rate: number; negative?: boolean }) {
  if (!isFinite(rate)) rate = 0
  return (
    <div className="flex flex-col items-center px-3">
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full",
        negative ? "bg-red-50" : "bg-green-50"
      )}>
        <ArrowRight className={cn("h-4 w-4", negative ? "text-red-400" : "text-green-500")} />
      </div>
      <span className={cn("text-xs font-medium mt-1", negative ? "text-red-500" : "text-green-600")}>
        {rate.toFixed(1)}%
      </span>
    </div>
  )
}

// Comparison Row for the comparison table
function ComparisonRow({ label, current, previous, isPercent, invertTrend, decimals = 0 }: {
  label: string
  current: number
  previous: number
  isPercent?: boolean
  invertTrend?: boolean
  decimals?: number
}) {
  const change = calcChange(current, previous)
  const hasChange = change !== null && isFinite(change)
  let isPositive = hasChange && change > 0
  if (invertTrend) isPositive = !isPositive

  const formatValue = (val: number) => {
    if (isPercent) return `${val.toFixed(1)}%`
    if (decimals > 0) return val.toFixed(decimals)
    return val.toLocaleString()
  }

  return (
    <tr>
      <td className="py-2.5 text-gray-600">{label}</td>
      <td className="py-2.5 text-right font-medium">{formatValue(current)}</td>
      <td className="py-2.5 text-right text-gray-500">{formatValue(previous)}</td>
      <td className="py-2.5 text-right">
        {hasChange ? (
          <span className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>
    </tr>
  )
}
