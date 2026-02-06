"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ArrowLeftRight } from "lucide-react"
import { fetchDrops } from "@/lib/api"
import { DropWithStats } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// Unified color palette
const COLORS = {
  primary: '#00433a',
  primaryLight: '#00433a99',
  secondary: '#0ea5e9',
  secondaryLight: '#0ea5e999',
  women: '#ec4899',
  men: '#3b82f6',
  nonbinary: '#8b5cf6',
  success: '#10b981',
  danger: '#ef4444',
  gray: '#9ca3af',
}

export default function DropComparisonPageWrapper() {
  return (
    <React.Suspense fallback={
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    }>
      <DropComparisonPage />
    </React.Suspense>
  )
}

function DropComparisonPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [allDrops, setAllDrops] = React.useState<DropWithStats[]>([])
  const [loading, setLoading] = React.useState(true)
  const [drop1Id, setDrop1Id] = React.useState<string | null>(searchParams.get('drop1'))
  const [drop2Id, setDrop2Id] = React.useState<string | null>(searchParams.get('drop2'))

  React.useEffect(() => {
    fetchDrops()
      .then(res => {
        setAllDrops(res.data)
        if (!drop1Id && res.data.length > 0) setDrop1Id(res.data[0].id)
        if (!drop2Id && res.data.length > 1) setDrop2Id(res.data[1].id)
      })
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    if (drop1Id && drop2Id) {
      const params = new URLSearchParams()
      params.set('drop1', drop1Id)
      params.set('drop2', drop2Id)
      router.replace(`/drops/compare?${params.toString()}`, { scroll: false })
    }
  }, [drop1Id, drop2Id, router])

  const drop1 = React.useMemo(() => allDrops.find(d => d.id === drop1Id), [allDrops, drop1Id])
  const drop2 = React.useMemo(() => allDrops.find(d => d.id === drop2Id), [allDrops, drop2Id])

  // Prepare data for overview charts (all drops, sorted by number)
  const overviewData = React.useMemo(() => {
    return [...allDrops]
      .sort((a, b) => a.number - b.number)
      .map(d => ({
        name: `#${d.number}`,
        dropNum: d.number,
        participants: d.stats?.total_participants ?? 0,
        matches: d.stats?.total_conversations ?? 0,
        matchRate: d.stats ? (d.stats.match_rate * 100) : 0,
        unmatchRate: d.stats ? (d.stats.unmatch_rate * 100) : 0,
        women: d.stats?.women_participants ?? 0,
        men: d.stats?.men_participants ?? 0,
        nonbinary: d.stats?.nonbinary_participants ?? 0,
      }))
  }, [allDrops])

  // Prepare data for comparison bar charts
  const comparisonData = React.useMemo(() => {
    if (!drop1?.stats || !drop2?.stats) return null
    const s1 = drop1.stats
    const s2 = drop2.stats

    return {
      overview: [
        { metric: 'Participants', [`Drop #${drop1.number}`]: s1.total_participants, [`Drop #${drop2.number}`]: s2.total_participants },
        { metric: 'Matches', [`Drop #${drop1.number}`]: s1.total_conversations, [`Drop #${drop2.number}`]: s2.total_conversations },
        { metric: 'Requests', [`Drop #${drop1.number}`]: s1.total_match_requests, [`Drop #${drop2.number}`]: s2.total_match_requests },
      ],
      rates: [
        { metric: 'Match Rate', [`Drop #${drop1.number}`]: +(s1.match_rate * 100).toFixed(1), [`Drop #${drop2.number}`]: +(s2.match_rate * 100).toFixed(1) },
        { metric: 'Unmatch Rate', [`Drop #${drop1.number}`]: +(s1.unmatch_rate * 100).toFixed(1), [`Drop #${drop2.number}`]: +(s2.unmatch_rate * 100).toFixed(1) },
      ],
      gender: [
        { metric: 'Women', [`Drop #${drop1.number}`]: s1.women_participants, [`Drop #${drop2.number}`]: s2.women_participants },
        { metric: 'Men', [`Drop #${drop1.number}`]: s1.men_participants, [`Drop #${drop2.number}`]: s2.men_participants },
        { metric: 'Non-binary', [`Drop #${drop1.number}`]: s1.nonbinary_participants, [`Drop #${drop2.number}`]: s2.nonbinary_participants },
      ],
      activity: [
        { metric: 'Avg Candidates', [`Drop #${drop1.number}`]: +s1.avg_candidates_per_participant.toFixed(1), [`Drop #${drop2.number}`]: +s2.avg_candidates_per_participant.toFixed(1) },
        { metric: 'Unique Senders', [`Drop #${drop1.number}`]: s1.unique_request_senders, [`Drop #${drop2.number}`]: s2.unique_request_senders },
        { metric: 'Unmatches', [`Drop #${drop1.number}`]: s1.total_unmatches, [`Drop #${drop2.number}`]: s2.total_unmatches },
      ],
    }
  }, [drop1, drop2])

  const swapDrops = () => {
    setDrop1Id(drop2Id)
    setDrop2Id(drop1Id)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const drop1Key = drop1 ? `Drop #${drop1.number}` : ''
  const drop2Key = drop2 ? `Drop #${drop2.number}` : ''

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/drops">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to drops
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Drop Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Overview and comparison of drop performance</p>
      </div>

      {/* Overview Charts - All Drops */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">All Drops Overview</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Participants & Matches Over Time */}
          <Card className="bg-white">
            <CardContent className="p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Participants & Matches</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={overviewData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={COLORS.gray} />
                    <YAxis tick={{ fontSize: 12 }} stroke={COLORS.gray} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="participants" name="Participants" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 4, fill: COLORS.primary }} />
                    <Line type="monotone" dataKey="matches" name="Matches" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 4, fill: COLORS.secondary }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Match & Unmatch Rate Over Time */}
          <Card className="bg-white">
            <CardContent className="p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Match & Unmatch Rates</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={overviewData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={COLORS.gray} />
                    <YAxis tick={{ fontSize: 12 }} stroke={COLORS.gray} unit="%" />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                      labelStyle={{ fontWeight: 600 }}
                      formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="matchRate" name="Match Rate" stroke={COLORS.success} strokeWidth={2} dot={{ r: 4, fill: COLORS.success }} />
                    <Line type="monotone" dataKey="unmatchRate" name="Unmatch Rate" stroke={COLORS.danger} strokeWidth={2} dot={{ r: 4, fill: COLORS.danger }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gender Distribution Over Time */}
          <Card className="bg-white lg:col-span-2">
            <CardContent className="p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Gender Distribution by Drop</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={COLORS.gray} />
                    <YAxis tick={{ fontSize: 12 }} stroke={COLORS.gray} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Legend />
                    <Bar dataKey="women" name="Women" fill={COLORS.women} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="men" name="Men" fill={COLORS.men} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="nonbinary" name="Non-binary" fill={COLORS.nonbinary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drop Comparison Section */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Compare Two Drops</h2>
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={drop1Id || ""} onValueChange={setDrop1Id}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select first drop" />
                </SelectTrigger>
                <SelectContent>
                  {allDrops.map(d => (
                    <SelectItem key={d.id} value={d.id} disabled={d.id === drop2Id}>
                      Drop #{d.number} — {formatDate(d.start_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="ghost" size="icon" onClick={swapDrops} className="h-9 w-9">
                <ArrowLeftRight className="h-4 w-4 text-gray-400" />
              </Button>

              <Select value={drop2Id || ""} onValueChange={setDrop2Id}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select second drop" />
                </SelectTrigger>
                <SelectContent>
                  {allDrops.map(d => (
                    <SelectItem key={d.id} value={d.id} disabled={d.id === drop1Id}>
                      Drop #{d.number} — {formatDate(d.start_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {drop1 && drop2 && comparisonData ? (
        <div className="space-y-6">
          {/* Quick Stats Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard
              label="Participants"
              v1={drop1.stats!.total_participants}
              v2={drop2.stats!.total_participants}
              d1={drop1.number}
              d2={drop2.number}
            />
            <SummaryCard
              label="Matches"
              v1={drop1.stats!.total_conversations}
              v2={drop2.stats!.total_conversations}
              d1={drop1.number}
              d2={drop2.number}
            />
            <SummaryCard
              label="Match Rate"
              v1={drop1.stats!.match_rate * 100}
              v2={drop2.stats!.match_rate * 100}
              d1={drop1.number}
              d2={drop2.number}
              isPercent
            />
            <SummaryCard
              label="Unmatch Rate"
              v1={drop1.stats!.unmatch_rate * 100}
              v2={drop2.stats!.unmatch_rate * 100}
              d1={drop1.number}
              d2={drop2.number}
              isPercent
              invertBetter
            />
          </div>

          {/* Comparison Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Key Metrics Comparison */}
            <Card className="bg-white">
              <CardContent className="p-5">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Key Metrics Comparison</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.overview} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke={COLORS.gray} />
                      <YAxis type="category" dataKey="metric" tick={{ fontSize: 12 }} stroke={COLORS.gray} width={80} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Legend />
                      <Bar dataKey={drop1Key} fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                      <Bar dataKey={drop2Key} fill={COLORS.secondary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Rates Comparison */}
            <Card className="bg-white">
              <CardContent className="p-5">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Rates Comparison (%)</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.rates} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke={COLORS.gray} unit="%" />
                      <YAxis type="category" dataKey="metric" tick={{ fontSize: 12 }} stroke={COLORS.gray} width={100} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                        labelStyle={{ fontWeight: 600 }}
                        formatter={(value, name) => [`${value}%`, name]}
                      />
                      <Legend />
                      <Bar dataKey={drop1Key} fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                      <Bar dataKey={drop2Key} fill={COLORS.secondary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gender Comparison */}
            <Card className="bg-white">
              <CardContent className="p-5">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Gender Breakdown</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.gender}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="metric" tick={{ fontSize: 12 }} stroke={COLORS.gray} />
                      <YAxis tick={{ fontSize: 12 }} stroke={COLORS.gray} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Legend />
                      <Bar dataKey={drop1Key} fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey={drop2Key} fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activity Comparison */}
            <Card className="bg-white">
              <CardContent className="p-5">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Activity Metrics</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.activity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="metric" tick={{ fontSize: 12 }} stroke={COLORS.gray} />
                      <YAxis tick={{ fontSize: 12 }} stroke={COLORS.gray} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Legend />
                      <Bar dataKey={drop1Key} fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey={drop2Key} fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Comparison Table */}
          <Card className="bg-white">
            <CardContent className="p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Detailed Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Metric</th>
                      <th className="text-right py-3 px-4 font-medium" style={{ color: COLORS.primary }}>Drop #{drop1.number}</th>
                      <th className="text-right py-3 px-4 font-medium" style={{ color: COLORS.secondary }}>Drop #{drop2.number}</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <CompareRow label="Participants" v1={drop1.stats!.total_participants} v2={drop2.stats!.total_participants} />
                    <CompareRow label="Matches" v1={drop1.stats!.total_conversations} v2={drop2.stats!.total_conversations} />
                    <CompareRow label="Match Rate" v1={drop1.stats!.match_rate * 100} v2={drop2.stats!.match_rate * 100} isPercent />
                    <CompareRow label="Unmatch Rate" v1={drop1.stats!.unmatch_rate * 100} v2={drop2.stats!.unmatch_rate * 100} isPercent invertBetter />
                    <CompareRow label="Total Requests" v1={drop1.stats!.total_match_requests} v2={drop2.stats!.total_match_requests} />
                    <CompareRow label="Unique Senders" v1={drop1.stats!.unique_request_senders} v2={drop2.stats!.unique_request_senders} />
                    <CompareRow label="Rejections" v1={drop1.stats!.total_match_rejections} v2={drop2.stats!.total_match_rejections} invertBetter />
                    <CompareRow label="Unmatches" v1={drop1.stats!.total_unmatches} v2={drop2.stats!.total_unmatches} invertBetter />
                    <CompareRow label="Avg Candidates/User" v1={drop1.stats!.avg_candidates_per_participant} v2={drop2.stats!.avg_candidates_per_participant} decimals={1} />
                    <CompareRow label="Women" v1={drop1.stats!.women_participants} v2={drop2.stats!.women_participants} />
                    <CompareRow label="Men" v1={drop1.stats!.men_participants} v2={drop2.stats!.men_participants} />
                    <CompareRow label="Non-binary" v1={drop1.stats!.nonbinary_participants} v2={drop2.stats!.nonbinary_participants} />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <p className="text-yellow-700">
              Please select two drops with statistics to compare.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SummaryCard({ label, v1, v2, d1, d2, isPercent, invertBetter }: {
  label: string
  v1: number
  v2: number
  d1: number
  d2: number
  isPercent?: boolean
  invertBetter?: boolean
}) {
  const diff = v1 - v2
  const pctChange = v2 !== 0 ? ((v1 - v2) / v2) * 100 : 0
  const isBetter = invertBetter ? diff < 0 : diff > 0

  const format = (val: number) => isPercent ? `${val.toFixed(1)}%` : val.toLocaleString()

  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <p className="text-sm text-gray-500 mb-2">{label}</p>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-semibold" style={{ color: COLORS.primary }}>{format(v1)}</div>
            <div className="text-sm" style={{ color: COLORS.primary }}>#{d1}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold" style={{ color: COLORS.secondary }}>{format(v2)}</div>
            <div className="text-xs" style={{ color: COLORS.secondary }}>#{d2}</div>
          </div>
        </div>
        {diff !== 0 && (
          <div className={cn(
            "text-xs font-medium mt-2 py-1 px-2 rounded inline-block",
            isBetter ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
          )}>
            {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}% vs #{d2}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CompareRow({ label, v1, v2, isPercent, invertBetter, decimals = 0 }: {
  label: string
  v1: number
  v2: number
  isPercent?: boolean
  invertBetter?: boolean
  decimals?: number
}) {
  const diff = v1 - v2
  const pctChange = v2 !== 0 ? ((v1 - v2) / v2) * 100 : 0
  const isBetter = invertBetter ? diff < 0 : diff > 0

  const format = (val: number) => {
    if (isPercent) return `${val.toFixed(1)}%`
    if (decimals > 0) return val.toFixed(decimals)
    return val.toLocaleString()
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="py-3 px-4 text-gray-600">{label}</td>
      <td className="py-3 px-4 text-right font-medium" style={{ color: COLORS.primary }}>{format(v1)}</td>
      <td className="py-3 px-4 text-right font-medium" style={{ color: COLORS.secondary }}>{format(v2)}</td>
      <td className="py-3 px-4 text-right">
        {diff !== 0 ? (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded",
            isBetter ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
          )}>
            {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>
    </tr>
  )
}
