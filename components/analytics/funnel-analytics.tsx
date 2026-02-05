"use client"

import * as React from "react"
import {
  ActivationFunnelStats,
  FunnelTrend,
} from "@/lib/types"
import {
  fetchFunnelStats,
  fetchFunnelTrends,
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
  Cell,
} from "recharts"
import {
  Users,
  UserCheck,
  CheckCircle2,
  Heart,
  MessageSquare,
  ArrowRight,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = {
  primary: '#00433a',
  secondary: '#10b981',
  tertiary: '#3b82f6',
  quaternary: '#8b5cf6',
  quinary: '#ec4899',
  gray: '#9ca3af',
}

const PERIODS = [
  { value: '1', label: '1D' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: 'all', label: 'All' },
]

const FUNNEL_COLORS = [
  COLORS.primary,
  '#00574d',
  '#006b5f',
  '#007f71',
  '#009383',
]

export function FunnelAnalytics() {
  const [stats, setStats] = React.useState<ActivationFunnelStats | null>(null)
  const [trends, setTrends] = React.useState<FunnelTrend[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState('30')

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const periodParam = period === 'all' ? undefined : period
        const [statsData, trendsData] = await Promise.all([
          fetchFunnelStats(periodParam),
          fetchFunnelTrends(periodParam),
        ])
        setStats(statsData)
        setTrends(trendsData)
      } catch (err) {
        console.error('Failed to load funnel analytics:', err)
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
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
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

  // Funnel chart data
  const funnelData = [
    { stage: 'Signups', count: stats.signups, rate: 100 },
    { stage: 'Profile Created', count: stats.profiles_created, rate: stats.conversion_rates.signup_to_profile },
    { stage: 'Completed', count: stats.profiles_completed, rate: stats.conversion_rates.profile_to_complete },
    { stage: 'First Match', count: stats.with_match, rate: stats.conversion_rates.complete_to_match },
    { stage: 'First Message', count: stats.with_message, rate: stats.conversion_rates.match_to_message },
  ]

  // Trend data for chart
  const trendData = trends.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    signups: t.signups,
    completed: t.completed,
    matched: t.with_match,
    messaged: t.with_message,
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

      {/* Funnel Stage Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <FunnelStageCard
          label="Signups"
          value={stats.signups}
          icon={Users}
          color={FUNNEL_COLORS[0]}
        />
        <FunnelStageCard
          label="Profile Created"
          value={stats.profiles_created}
          rate={stats.conversion_rates.signup_to_profile}
          icon={UserCheck}
          color={FUNNEL_COLORS[1]}
        />
        <FunnelStageCard
          label="Completed"
          value={stats.profiles_completed}
          rate={stats.conversion_rates.profile_to_complete}
          icon={CheckCircle2}
          color={FUNNEL_COLORS[2]}
        />
        <FunnelStageCard
          label="First Match"
          value={stats.with_match}
          rate={stats.conversion_rates.complete_to_match}
          icon={Heart}
          color={FUNNEL_COLORS[3]}
        />
        <FunnelStageCard
          label="First Message"
          value={stats.with_message}
          rate={stats.conversion_rates.match_to_message}
          icon={MessageSquare}
          color={FUNNEL_COLORS[4]}
        />
      </div>

      {/* Overall Conversion & Time Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <ArrowRight className="h-4 w-4" />
              Overall Conversion
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.conversion_rates.overall.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400">Signup → Message</p>
          </CardContent>
        </Card>
        <TimeCard
          label="Avg Time to Profile"
          hours={stats.avg_time_to_profile_hours}
          icon={Clock}
        />
        <TimeCard
          label="Avg Time to Complete"
          hours={stats.avg_time_to_complete_hours}
          icon={Clock}
        />
        <TimeCard
          label="Avg Time to First Message"
          hours={stats.avg_time_to_message_hours}
          icon={Clock}
        />
      </div>

      {/* Funnel Visualization */}
      <Card className="bg-white">
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Activation Funnel</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ left: 100, right: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke={COLORS.gray} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 12 }}
                  stroke={COLORS.gray}
                  width={90}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(value, name) => [
                    Number(value).toLocaleString(),
                    name === 'count' ? 'Users' : 'Rate'
                  ]}
                />
                <Bar dataKey="count" name="Users" radius={[0, 4, 4, 0]}>
                  {funnelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion rates between stages */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {funnelData.slice(1).map((stage, i) => (
              <React.Fragment key={stage.stage}>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-400">{funnelData[i].stage}</span>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <span className={cn(
                    "font-medium",
                    stage.rate >= 50 ? "text-green-600" : stage.rate >= 25 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {stage.rate.toFixed(0)}%
                  </span>
                </div>
                {i < funnelData.length - 2 && (
                  <span className="text-gray-300 mx-2">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Funnel Trends */}
      <Card className="bg-white">
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Activation Trends Over Time</h3>
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
                  dataKey="signups"
                  name="Signups"
                  stroke={FUNNEL_COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke={FUNNEL_COLORS[2]}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="matched"
                  name="Matched"
                  stroke={FUNNEL_COLORS[3]}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="messaged"
                  name="Messaged"
                  stroke={FUNNEL_COLORS[4]}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FunnelStageCard({
  label,
  value,
  rate,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  rate?: number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {value.toLocaleString()}
            </p>
            {rate !== undefined && (
              <p className={cn(
                "text-xs mt-0.5",
                rate >= 50 ? "text-green-600" : rate >= 25 ? "text-yellow-600" : "text-red-600"
              )}>
                {rate.toFixed(1)}% conversion
              </p>
            )}
          </div>
          <div
            className="rounded-lg p-2.5"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TimeCard({
  label,
  hours,
  icon: Icon,
}: {
  label: string
  hours: number
  icon: React.ElementType
}) {
  const formatTime = (h: number) => {
    if (h < 1) return `${Math.round(h * 60)}m`
    if (h < 24) return `${h.toFixed(1)}h`
    return `${(h / 24).toFixed(1)}d`
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {formatTime(hours)}
            </p>
          </div>
          <div className="rounded-lg p-2.5 bg-blue-50 text-blue-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
