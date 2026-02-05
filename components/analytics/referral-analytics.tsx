"use client"

import * as React from "react"
import {
  ReferralStats,
  ReferralCodeStats,
  ReferralTrend,
} from "@/lib/types"
import {
  fetchReferralStats,
  fetchTopReferralCodes,
  fetchReferralTrends,
} from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  Share2,
  Users,
  UserCheck,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = {
  primary: '#00433a',
  referral: '#8b5cf6',
  organic: '#3b82f6',
  success: '#10b981',
  gray: '#9ca3af',
}

const PERIODS = [
  { value: '1', label: '1D' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: 'all', label: 'All' },
]

export function ReferralAnalytics() {
  const [stats, setStats] = React.useState<ReferralStats | null>(null)
  const [codes, setCodes] = React.useState<ReferralCodeStats[]>([])
  const [trends, setTrends] = React.useState<ReferralTrend[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState('30')

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const periodParam = period === 'all' ? undefined : period
        const [statsData, codesData, trendsData] = await Promise.all([
          fetchReferralStats(periodParam),
          fetchTopReferralCodes(periodParam, 10),
          fetchReferralTrends(periodParam),
        ])
        setStats(statsData)
        setCodes(codesData)
        setTrends(trendsData)
      } catch (err) {
        console.error('Failed to load referral analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [period])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  // Format trends for chart
  const trendData = trends.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    referrals: t.referrals,
    organic: t.organic,
  }))

  // Comparison data for bar chart
  const comparisonData = [
    {
      metric: '7-Day Retention',
      Referral: stats.referral_vs_organic.referral_retention_7d,
      Organic: stats.referral_vs_organic.organic_retention_7d,
    },
    {
      metric: 'Match Rate',
      Referral: stats.referral_vs_organic.referral_match_rate,
      Organic: stats.referral_vs_organic.organic_match_rate,
    },
  ]

  const retentionDiff = stats.referral_vs_organic.referral_retention_7d - stats.referral_vs_organic.organic_retention_7d
  const matchDiff = stats.referral_vs_organic.referral_match_rate - stats.referral_vs_organic.organic_match_rate

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant="ghost"
            size="sm"
            onClick={() => setPeriod(p.value)}
            className={cn(
              "px-3 min-w-[48px]",
              period === p.value
                ? "bg-white shadow-sm text-gray-900 hover:bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-transparent"
            )}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Referrals"
          value={stats.total_referrals.toLocaleString()}
          icon={Share2}
          color="purple"
        />
        <StatCard
          label="Unique Referrers"
          value={stats.unique_referrers.toLocaleString()}
          icon={Users}
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats.conversion_rate.toFixed(1)}%`}
          subtitle="Referral → Live"
          icon={UserCheck}
          color="green"
        />
        <StatCard
          label="Referral Quality"
          value={retentionDiff >= 0 ? `+${retentionDiff.toFixed(0)}%` : `${retentionDiff.toFixed(0)}%`}
          subtitle="vs Organic (7d retention)"
          icon={retentionDiff >= 0 ? ArrowUpRight : ArrowDownRight}
          color={retentionDiff >= 0 ? "green" : "red"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referral vs Organic Trends */}
        <Card className="bg-white">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Referral vs Organic Signups</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke={COLORS.gray}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke={COLORS.gray} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="referrals"
                    name="Referrals"
                    stroke={COLORS.referral}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="organic"
                    name="Organic"
                    stroke={COLORS.organic}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Referral vs Organic Comparison */}
        <Card className="bg-white">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Referral vs Organic Quality</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke={COLORS.gray} domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="metric"
                    tick={{ fontSize: 12 }}
                    stroke={COLORS.gray}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, '']}
                  />
                  <Legend />
                  <Bar dataKey="Referral" fill={COLORS.referral} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Organic" fill={COLORS.organic} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-4">
              <ComparisonStat
                label="Retention Diff"
                value={retentionDiff}
                suffix="%"
              />
              <ComparisonStat
                label="Match Rate Diff"
                value={matchDiff}
                suffix="%"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Referral Codes Table */}
      <Card className="bg-white">
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Top Referral Codes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">#</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Code</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Uses</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Conversions</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Rate</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code, i) => (
                  <tr key={code.code} className="border-b last:border-0">
                    <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {i < 3 && (
                          <Award className={cn(
                            "h-4 w-4",
                            i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-600"
                          )} />
                        )}
                        <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                          {code.code}
                        </code>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-900 font-medium">
                      {code.uses.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600">
                      {code.conversions.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        code.conversion_rate >= 50 ? "bg-green-100 text-green-700" :
                        code.conversion_rate >= 25 ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {code.conversion_rate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {codes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No referral codes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color?: 'green' | 'purple' | 'red'
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "rounded-lg p-2.5",
            color ? colorClasses[color] : "bg-gray-100 text-gray-600"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ComparisonStat({
  label,
  value,
  suffix,
}: {
  label: string
  value: number
  suffix: string
}) {
  const isPositive = value >= 0

  return (
    <div className="text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn(
        "text-lg font-semibold",
        isPositive ? "text-green-600" : "text-red-600"
      )}>
        {isPositive ? '+' : ''}{value.toFixed(1)}{suffix}
      </p>
    </div>
  )
}
