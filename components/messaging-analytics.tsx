"use client"

import * as React from "react"
import {
  MessagingStats,
  MessagingTrend,
  MessagesByGender,
  ResponseByHour,
} from "@/lib/types"
import {
  fetchMessagingStats,
  fetchMessagingTrends,
  fetchMessagesByHour,
  fetchMessagesByGender,
} from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
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
  MessageSquare,
  TrendingUp,
  Clock,
  Heart,
  HeartOff,
  Users,
  ArrowRightLeft,
  Reply,
  Calendar,
  MessageCircle,
  Ghost,
  Mail,
  Type,
  CalendarCheck,
  Users2,
  ShieldX,
  Sparkles,
  Star,
  ThumbsDown,
  Bell,
  CheckCircle2,
  MessageSquarePlus,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = {
  primary: '#00433a',
  primaryLight: '#00433a80',
  primaryLighter: '#00433a40',
  secondary: '#10b981',
  secondaryLight: '#10b98180',
  women: '#ec4899',
  men: '#3b82f6',
  nonbinary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: '#9ca3af',
}

const PERIODS = [
  { value: '1', label: '1D' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: 'all', label: 'All' },
]

// Collapsible Section Component
function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t bg-gray-50/50">
          {children}
        </div>
      )}
    </div>
  )
}

export function MessagingAnalytics() {
  const [stats, setStats] = React.useState<MessagingStats | null>(null)
  const [trends, setTrends] = React.useState<MessagingTrend[]>([])
  const [byHour, setByHour] = React.useState<ResponseByHour[]>([])
  const [byGender, setByGender] = React.useState<MessagesByGender | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState('all')

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const periodParam = period === 'all' ? undefined : period
        const [statsData, trendsData, byHourData, byGenderData] = await Promise.all([
          fetchMessagingStats(periodParam),
          fetchMessagingTrends(periodParam),
          fetchMessagesByHour(periodParam),
          fetchMessagesByGender(periodParam),
        ])
        setStats(statsData)
        setTrends(trendsData)
        setByHour(byHourData)
        setByGender(byGenderData)
      } catch (err) {
        console.error('Failed to load messaging analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [period])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
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

  const periodLabel = PERIODS.find(p => p.value === period)?.label || 'All'

  // Format trends data for charts
  const trendData = trends.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    messages: t.messages,
    active_conversations: t.active_conversations,
  }))

  // Format hourly data
  const formatHour = (hour: number) => {
    if (hour === 0) return '12am'
    if (hour === 12) return '12pm'
    if (hour < 12) return `${hour}am`
    return `${hour - 12}pm`
  }

  const calculateMovingAverage = (data: typeof byHour, windowSize = 3) => {
    return data.map((_, index) => {
      const halfWindow = Math.floor(windowSize / 2)
      let sum = 0
      let count = 0
      for (let i = -halfWindow; i <= halfWindow; i++) {
        const idx = (index + i + data.length) % data.length
        sum += data[idx].message_count
        count++
      }
      return Math.round(sum / count)
    })
  }

  const movingAvg = calculateMovingAverage(byHour)
  const hourlyData = byHour.map((h, i) => ({
    hour: formatHour(h.hour),
    message_count: h.message_count,
    moving_avg: movingAvg[i],
  }))

  // Gender pie chart data
  const genderData = byGender ? [
    { name: 'Women', value: byGender.women, color: COLORS.women },
    { name: 'Men', value: byGender.men, color: COLORS.men },
    { name: 'Non-binary', value: byGender.nonbinary, color: COLORS.nonbinary },
  ].filter(d => d.value > 0) : []

  // Match engagement breakdown data
  const convBreakdownData = [
    { name: '1-4 msgs', value: stats.conversations_by_message_count.one_to_four, color: COLORS.primaryLight },
    { name: '5+ msgs', value: stats.conversations_by_message_count.five_plus, color: COLORS.primary },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-4">
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

      {/* Overview Section - Always visible */}
      <Section title="Overview" defaultOpen={true}>
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard
            label="Total Messages"
            value={stats.total_messages.toLocaleString()}
            subtitle={period !== 'all' ? `Last ${periodLabel}` : undefined}
            icon={MessageSquare}
          />
          {period === 'all' ? (
            <StatCard
              label="Messages Today"
              value={stats.messages_today.toLocaleString()}
              subtitle={`${stats.messages_this_week.toLocaleString()} this week`}
              icon={Calendar}
            />
          ) : (
            <StatCard
              label="Avg/Day"
              value={period === '1' ? stats.total_messages.toLocaleString() : (stats.total_messages / parseInt(period)).toFixed(0)}
              subtitle="messages per day"
              icon={Calendar}
            />
          )}
          <StatCard
            label="Active Conversations"
            value={stats.active_conversations.toLocaleString()}
            subtitle={period === 'all' ? 'Last 7 days' : `Last ${periodLabel}`}
            icon={Users}
            color="green"
          />
          <StatCard
            label="Avg Messages/Conv"
            value={stats.avg_messages_per_conversation.toFixed(1)}
            icon={TrendingUp}
            color="blue"
          />
        </div>
      </Section>

      {/* Response & Engagement */}
      <Section title="Response & Engagement" defaultOpen={true}>
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard
            label="Matches with Messages"
            value={`${stats.matches_with_messages_pct.toFixed(1)}%`}
            subtitle="of all matches"
            icon={MessageSquare}
            color="green"
          />
          <StatCard
            label="Reply Rate"
            value={`${stats.first_message_reply_rate.toFixed(1)}%`}
            subtitle="first messages replied to"
            icon={Reply}
            color="blue"
          />
          <StatCard
            label="Avg Response Time"
            value={formatResponseTime(stats.avg_response_time_hours)}
            icon={Clock}
          />
          <StatCard
            label="Contact Exchanged"
            value={stats.contact_exchange_count.toLocaleString()}
            subtitle={`${stats.contact_exchange_rate.toFixed(1)}% rate`}
            icon={ArrowRightLeft}
            color="green"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-4 mt-3">
          <StatCard
            label="Liked Messages"
            value={stats.liked_messages_count.toLocaleString()}
            subtitle={`${stats.liked_messages_rate.toFixed(1)}% rate`}
            icon={Heart}
            color="pink"
          />
          <MetricCard
            label="5+ messages"
            value={stats.conversations_by_message_count.five_plus}
            total={stats.conversations_by_message_count.one_to_four + stats.conversations_by_message_count.five_plus}
          />
          <MetricCard
            label="1-4 messages"
            value={stats.conversations_by_message_count.one_to_four}
            total={stats.conversations_by_message_count.one_to_four + stats.conversations_by_message_count.five_plus}
          />
          <StatCard
            label="Unmatched"
            value={stats.unmatched_count.toLocaleString()}
            subtitle={`${stats.unmatch_rate.toFixed(1)}% of matches`}
            icon={HeartOff}
            color="red"
          />
        </div>
      </Section>

      {/* Behavior & Quality */}
      <Section title="Behavior & Quality" defaultOpen={false}>
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard
            label="Plans Detected"
            value={stats.conversations_with_plans.toLocaleString()}
            subtitle={`${stats.plans_rate.toFixed(1)}% of conversations`}
            icon={CalendarCheck}
            color="green"
          />
          <StatCard
            label="Ghost Rate"
            value={`${stats.ghost_rate.toFixed(1)}%`}
            subtitle={`${stats.ghosted_conversations} convos inactive 7+ days`}
            icon={Ghost}
            color="red"
          />
          <StatCard
            label="Double Texting"
            value={`${stats.double_text_rate.toFixed(1)}%`}
            subtitle={`${stats.double_text_conversations} conversations`}
            icon={MessageCircle}
          />
          <StatCard
            label="Avg Message Length"
            value={`${Math.round(stats.avg_message_length)} chars`}
            icon={Type}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-4 mt-3">
          <StatCard
            label="Unread Convos"
            value={stats.unread_conversations.toLocaleString()}
            subtitle="with pending messages"
            icon={Mail}
            color="blue"
          />
          <StatCard
            label="Mutual Messaging"
            value={`${stats.mutual_messaging_rate.toFixed(1)}%`}
            subtitle={`${stats.mutual_messaging_count} two-way convos`}
            icon={Users2}
            color="green"
          />
          <StatCard
            label="Block Rate"
            value={`${stats.block_rate.toFixed(1)}%`}
            subtitle={`${stats.blocked_conversations} blocked`}
            icon={ShieldX}
            color="red"
          />
          <OverlapsImpactCard
            label="Overlaps Impact"
            withOverlaps={stats.avg_messages_with_overlaps}
            withoutOverlaps={stats.avg_messages_without_overlaps}
          />
        </div>
      </Section>

      {/* Match Requests */}
      <Section title="Match Requests & Notifications" defaultOpen={false}>
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard
            label="Request Acceptance"
            value={`${stats.request_acceptance_rate.toFixed(1)}%`}
            subtitle={`${stats.accepted_requests.toLocaleString()} of ${stats.total_requests.toLocaleString()}`}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            label="Requests with Message"
            value={`${stats.message_with_request_rate.toFixed(1)}%`}
            subtitle={`${stats.requests_with_message.toLocaleString()} personalized`}
            icon={MessageSquarePlus}
            color="blue"
          />
          <StatCard
            label="Standout Conversion"
            value={`${stats.standout_conversion_rate.toFixed(1)}%`}
            subtitle={`${stats.standouts_converted} of ${stats.total_standouts} standouts`}
            icon={Star}
            color="pink"
          />
          <StatCard
            label="Notification Delivery"
            value={`${stats.notification_delivery_rate.toFixed(1)}%`}
            subtitle={`${stats.notifications_delivered.toLocaleString()} of ${stats.total_notifications.toLocaleString()}`}
            icon={Bell}
            color="blue"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2 mt-3">
          <OpenerCard
            label="Who Opens First"
            women={stats.first_message_by_gender.women}
            men={stats.first_message_by_gender.men}
            nonbinary={stats.first_message_by_gender.nonbinary}
          />
          <RejectionCard
            label="Rejections by Gender"
            women={stats.rejection_by_gender.women}
            men={stats.rejection_by_gender.men}
            nonbinary={stats.rejection_by_gender.nonbinary}
          />
        </div>
      </Section>

      {/* Charts */}
      <Section title="Charts & Trends" defaultOpen={false}>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Messages Over Time */}
          <Card className="bg-white border-0 shadow-none">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Messages (Last 30 Days)</h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke={COLORS.gray} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} stroke={COLORS.gray} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Legend />
                    <Line type="monotone" dataKey="messages" name="Messages" stroke={COLORS.primary} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="active_conversations" name="Active Convos" stroke={COLORS.success} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Message Activity by Hour */}
          <Card className="bg-white border-0 shadow-none">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Activity by Hour</h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke={COLORS.gray} interval={2} />
                    <YAxis tick={{ fontSize: 10 }} stroke={COLORS.gray} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="message_count" name="Messages" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="moving_avg" name="3-hr Avg" stroke={COLORS.danger} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gender Breakdown */}
          <Card className="bg-white border-0 shadow-none">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Messages by Gender</h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Messages']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Match Engagement */}
          <Card className="bg-white border-0 shadow-none">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Match Engagement</h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={convBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {convBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Matches']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                {convBreakdownData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-gray-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  )
}

function formatResponseTime(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
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
  color?: 'green' | 'blue' | 'pink' | 'red'
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    pink: 'bg-pink-50 text-pink-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 truncate">{label}</p>
            <p className="text-xl font-semibold text-gray-900 mt-0.5">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "rounded-lg p-2 ml-2 shrink-0",
            color ? colorClasses[color] : "bg-gray-100 text-gray-600"
          )}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({
  label,
  value,
  total,
}: {
  label: string
  value: number
  total: number
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <Card className="bg-white">
      <CardContent className="p-3">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900 mt-0.5">
          {value.toLocaleString()}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00433a] rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{percentage.toFixed(0)}%</span>
        </div>
      </CardContent>
    </Card>
  )
}

function OpenerCard({
  label,
  women,
  men,
  nonbinary,
}: {
  label: string
  women: number
  men: number
  nonbinary: number
}) {
  const total = women + men + nonbinary
  const womenPct = total > 0 ? (women / total) * 100 : 0
  const menPct = total > 0 ? (men / total) * 100 : 0
  const nonbinaryPct = total > 0 ? (nonbinary / total) * 100 : 0

  return (
    <Card className="bg-white">
      <CardContent className="p-3">
        <p className="text-xs text-gray-500 mb-2">{label}</p>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
          <div className="h-full" style={{ width: `${womenPct}%`, backgroundColor: COLORS.women }} />
          <div className="h-full" style={{ width: `${menPct}%`, backgroundColor: COLORS.men }} />
          <div className="h-full" style={{ width: `${nonbinaryPct}%`, backgroundColor: COLORS.nonbinary }} />
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.women }} />
            <span className="text-gray-600">Women {womenPct.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.men }} />
            <span className="text-gray-600">Men {menPct.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.nonbinary }} />
            <span className="text-gray-600">NB {nonbinaryPct.toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OverlapsImpactCard({
  label,
  withOverlaps,
  withoutOverlaps,
}: {
  label: string
  withOverlaps: number
  withoutOverlaps: number
}) {
  const diff = withOverlaps - withoutOverlaps
  const diffPct = withoutOverlaps > 0 ? ((diff / withoutOverlaps) * 100) : 0
  const isPositive = diff > 0

  return (
    <Card className="bg-white">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-semibold text-gray-900">{withOverlaps.toFixed(1)}</span>
              <span className="text-xs text-gray-400">with /</span>
              <span className="text-lg font-semibold text-gray-600">{withoutOverlaps.toFixed(1)}</span>
              <span className="text-xs text-gray-400">without</span>
            </div>
            <p className={cn("text-xs mt-0.5", isPositive ? "text-green-600" : "text-gray-400")}>
              {isPositive ? '+' : ''}{diffPct.toFixed(0)}% avg msgs
            </p>
          </div>
          <div className={cn(
            "rounded-lg p-2",
            isPositive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"
          )}>
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RejectionCard({
  label,
  women,
  men,
  nonbinary,
}: {
  label: string
  women: number
  men: number
  nonbinary: number
}) {
  const total = women + men + nonbinary
  const womenPct = total > 0 ? (women / total) * 100 : 0
  const menPct = total > 0 ? (men / total) * 100 : 0
  const nonbinaryPct = total > 0 ? (nonbinary / total) * 100 : 0

  return (
    <Card className="bg-white">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500">{label}</p>
          <div className="rounded-lg p-1.5 bg-red-50 text-red-600">
            <ThumbsDown className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS.women }} />
            <p className="font-medium">{women.toLocaleString()}</p>
            <p className="text-gray-400">{womenPct.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS.men }} />
            <p className="font-medium">{men.toLocaleString()}</p>
            <p className="text-gray-400">{menPct.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS.nonbinary }} />
            <p className="font-medium">{nonbinary.toLocaleString()}</p>
            <p className="text-gray-400">{nonbinaryPct.toFixed(0)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
