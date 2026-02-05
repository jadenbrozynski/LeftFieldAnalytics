"use client"

import * as React from "react"
import {
  UserGrowthStats,
  RegistrationTrend,
  RetentionCohort,
} from "@/lib/types"
import {
  fetchGrowthStats,
  fetchRegistrationTrends,
  fetchRetentionCohorts,
} from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Users,
  UserPlus,
  TrendingUp,
  Clock,
  AlertTriangle,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = {
  primary: '#00433a',
  primaryLight: '#00433a80',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  blue: '#3b82f6',
  gray: '#9ca3af',
  live: '#10b981',
  waitlisted: '#f59e0b',
  banned: '#ef4444',
  deleted: '#9ca3af',
}

const PERIODS = [
  { value: '1', label: '1D' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: 'all', label: 'All' },
]

export function GrowthAnalytics() {
  const [stats, setStats] = React.useState<UserGrowthStats | null>(null)
  const [trends, setTrends] = React.useState<RegistrationTrend[]>([])
  const [cohorts, setCohorts] = React.useState<RetentionCohort[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState('30')

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const periodParam = period === 'all' ? undefined : period
        const [statsData, trendsData, cohortsData] = await Promise.all([
          fetchGrowthStats(periodParam),
          fetchRegistrationTrends(periodParam),
          fetchRetentionCohorts(),
        ])
        setStats(statsData)
        setTrends(trendsData)
        setCohorts(cohortsData)
      } catch (err) {
        console.error('Failed to load growth analytics:', err)
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
    registrations: t.registrations,
    cumulative: t.cumulative,
  }))

  // Status pie chart data
  const statusData = [
    { name: 'Live', value: stats.status_breakdown.live, color: COLORS.live },
    { name: 'Waitlisted', value: stats.status_breakdown.waitlisted, color: COLORS.waitlisted },
    { name: 'Banned', value: stats.status_breakdown.banned, color: COLORS.banned },
    { name: 'Deleted', value: stats.status_breakdown.deleted, color: COLORS.deleted },
  ].filter(d => d.value > 0)

  // Cohort data for heatmap-style table
  const cohortData = cohorts.slice(0, 8).map(c => ({
    week: new Date(c.cohort_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    size: c.cohort_size,
    d1: c.d1_pct,
    d7: c.d7_pct,
    d30: c.d30_pct,
    d90: c.d90_pct,
  }))

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
          label="Total Users"
          value={stats.total_users.toLocaleString()}
          icon={Users}
        />
        <StatCard
          label="New This Week"
          value={stats.new_this_week.toLocaleString()}
          subtitle={`${stats.new_this_month.toLocaleString()} this month`}
          icon={UserPlus}
          color="green"
        />
        <StatCard
          label="Avg User Lifetime"
          value={`${stats.avg_user_lifetime_days.toFixed(0)}d`}
          icon={Clock}
          color="blue"
        />
        <StatCard
          label="Churn Rate (7d)"
          value={`${stats.churn_rate_7d.toFixed(1)}%`}
          subtitle={`${stats.churn_rate_30d.toFixed(1)}% (30d)`}
          icon={AlertTriangle}
          color={stats.churn_rate_7d > 30 ? "red" : undefined}
        />
      </div>

      {/* Retention Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="D1 Retention"
          value={`${stats.d1_retention.toFixed(1)}%`}
          subtitle="Active after 1 day"
          icon={Activity}
          color={stats.d1_retention >= 50 ? "green" : stats.d1_retention >= 30 ? undefined : "red"}
        />
        <StatCard
          label="D7 Retention"
          value={`${stats.d7_retention.toFixed(1)}%`}
          subtitle="Active after 7 days"
          icon={Activity}
          color={stats.d7_retention >= 30 ? "green" : stats.d7_retention >= 20 ? undefined : "red"}
        />
        <StatCard
          label="D30 Retention"
          value={`${stats.d30_retention.toFixed(1)}%`}
          subtitle="Active after 30 days"
          icon={Activity}
          color={stats.d30_retention >= 20 ? "green" : stats.d30_retention >= 10 ? undefined : "red"}
        />
        <StatCard
          label="D90 Retention"
          value={`${stats.d90_retention.toFixed(1)}%`}
          subtitle="Active after 90 days"
          icon={Activity}
          color={stats.d90_retention >= 15 ? "green" : stats.d90_retention >= 5 ? undefined : "red"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Registration Trends */}
        <Card className="bg-white">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Registration Trends</h3>
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
                    dataKey="registrations"
                    name="Daily Registrations"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: COLORS.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Status Breakdown */}
        <Card className="bg-white">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">User Status Breakdown</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => {
                      // Only show label if slice is > 5%
                      if ((percent ?? 0) < 0.05) return null
                      return `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value) => [Number(value).toLocaleString(), 'Users']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 flex-wrap">
              {statusData.map((entry) => {
                const total = statusData.reduce((sum, d) => sum + d.value, 0)
                const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0
                return (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-gray-600">{entry.name} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retention Cohort Table */}
      <Card className="bg-white">
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Weekly Retention Cohorts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Cohort Week</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Size</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">D1</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">D7</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">D30</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">D90</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 px-3 text-gray-900">{row.week}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{row.size}</td>
                    <td className="py-2 px-3 text-right">
                      {row.d1 !== null ? (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          getRetentionColor(row.d1, 'd1')
                        )}>
                          {row.d1.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {row.d7 !== null ? (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          getRetentionColor(row.d7, 'd7')
                        )}>
                          {row.d7.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {row.d30 !== null ? (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          getRetentionColor(row.d30, 'd30')
                        )}>
                          {row.d30.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {row.d90 !== null ? (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          getRetentionColor(row.d90, 'd90')
                        )}>
                          {row.d90.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getRetentionColor(value: number, type: 'd1' | 'd7' | 'd30' | 'd90'): string {
  const thresholds = {
    d1: { good: 50, ok: 30 },
    d7: { good: 30, ok: 20 },
    d30: { good: 20, ok: 10 },
    d90: { good: 15, ok: 5 },
  }

  const t = thresholds[type]
  if (value >= t.good) return "bg-green-100 text-green-700"
  if (value >= t.ok) return "bg-yellow-100 text-yellow-700"
  return "bg-red-100 text-red-700"
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
  color?: 'green' | 'blue' | 'red'
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
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
