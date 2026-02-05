"use client"

import * as React from "react"
import {
  ProfileQualityStats,
  QualityDistribution,
  QualityImpactMetric,
} from "@/lib/types"
import {
  fetchQualityStats,
  fetchQualityDistribution,
  fetchQualityImpact,
} from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  Star,
  Image,
  FileText,
  CheckCircle,
  TrendingUp,
  Users,
  Award,
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = {
  primary: '#00433a',
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
  women: '#ec4899',
  men: '#3b82f6',
  nonbinary: '#8b5cf6',
  gray: '#9ca3af',
}

const PERIODS = [
  { value: '1', label: '1D' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: 'all', label: 'All' },
]

export function QualityAnalytics() {
  const [stats, setStats] = React.useState<ProfileQualityStats | null>(null)
  const [distribution, setDistribution] = React.useState<QualityDistribution[]>([])
  const [impact, setImpact] = React.useState<QualityImpactMetric[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState('all')

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const periodParam = period === 'all' ? undefined : period
        const [statsData, distributionData, impactData] = await Promise.all([
          fetchQualityStats(periodParam),
          fetchQualityDistribution(periodParam),
          fetchQualityImpact(periodParam),
        ])
        setStats(statsData)
        setDistribution(distributionData)
        setImpact(impactData)
      } catch (err) {
        console.error('Failed to load quality analytics:', err)
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

  // Field completion radar data
  const radarData = [
    { field: 'Bio', value: stats.field_completion.bio, fullMark: 100 },
    { field: 'School', value: stats.field_completion.school, fullMark: 100 },
    { field: 'Job', value: stats.field_completion.job_title, fullMark: 100 },
    { field: 'Hometown', value: stats.field_completion.hometown, fullMark: 100 },
    { field: 'Neighborhood', value: stats.field_completion.neighborhood, fullMark: 100 },
    { field: 'Height', value: stats.field_completion.height, fullMark: 100 },
  ]

  // Gender comparison data
  const genderData = [
    { gender: 'Women', score: stats.by_gender.women, color: COLORS.women },
    { gender: 'Men', score: stats.by_gender.men, color: COLORS.men },
    { gender: 'Non-binary', score: stats.by_gender.nonbinary, color: COLORS.nonbinary },
  ]

  // Impact data for chart
  const impactData = impact.map(i => ({
    tier: i.quality_tier.charAt(0).toUpperCase() + i.quality_tier.slice(1),
    matches: i.avg_matches,
    messages: i.avg_messages,
    count: i.profile_count,
    color: COLORS[i.quality_tier as keyof typeof COLORS],
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
          label="Avg Completeness Score"
          value={`${stats.avg_completeness_score.toFixed(0)}/100`}
          icon={Star}
          color={stats.avg_completeness_score >= 60 ? "green" : stats.avg_completeness_score >= 40 ? undefined : "red"}
        />
        <StatCard
          label="Avg Photos"
          value={stats.photo_metrics.avg_photos.toFixed(1)}
          subtitle={`${stats.photo_metrics.pct_with_6_photos.toFixed(0)}% with 6 photos`}
          icon={Image}
          color="blue"
        />
        <StatCard
          label="Bio Completion"
          value={`${stats.bio_metrics.pct_with_bio.toFixed(0)}%`}
          subtitle={`Avg ${stats.bio_metrics.avg_length.toFixed(0)} chars`}
          icon={FileText}
        />
        <StatCard
          label="Field Avg Completion"
          value={`${((
            stats.field_completion.bio +
            stats.field_completion.school +
            stats.field_completion.job_title +
            stats.field_completion.hometown +
            stats.field_completion.neighborhood +
            stats.field_completion.height
          ) / 6).toFixed(0)}%`}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Distribution */}
        <Card className="bg-white">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Score Distribution</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} stroke={COLORS.gray} />
                  <YAxis tick={{ fontSize: 11 }} stroke={COLORS.gray} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value, name) => [
                      name === 'count' ? Number(value).toLocaleString() : `${value}%`,
                      name === 'count' ? 'Profiles' : 'Percentage'
                    ]}
                  />
                  <Bar dataKey="count" name="Profiles" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Field Completion Radar */}
        <Card className="bg-white">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Field Completion Rates</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="field" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Completion %"
                    dataKey="value"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value) => [`${Number(value).toFixed(0)}%`, 'Completion']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quality Impact */}
        <Card className="bg-white">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Quality Impact on Engagement</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={impactData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="tier" tick={{ fontSize: 11 }} stroke={COLORS.gray} />
                  <YAxis tick={{ fontSize: 11 }} stroke={COLORS.gray} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value) => [Number(value).toFixed(1), '']}
                  />
                  <Legend />
                  <Bar dataKey="matches" name="Avg Matches" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="messages" name="Avg Messages" fill={COLORS.high} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-4 text-sm">
              {impactData.map(d => (
                <div key={d.tier} className="text-center">
                  <p className="text-gray-500">{d.tier}</p>
                  <p className="font-medium text-gray-900">{d.count.toLocaleString()} profiles</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gender Breakdown */}
        <Card className="bg-white">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Quality Score by Gender</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke={COLORS.gray} domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="gender"
                    tick={{ fontSize: 12 }}
                    stroke={COLORS.gray}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value) => [`${Number(value).toFixed(1)}/100`, 'Score']}
                  />
                  <Bar dataKey="score" name="Avg Score" radius={[0, 4, 4, 0]}>
                    {genderData.map((entry, index) => (
                      <rect key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {genderData.map((entry) => (
                <div key={entry.gender} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {entry.gender}: {entry.score.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Completion Details */}
      <Card className="bg-white">
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Field Completion Details</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FieldCompletionCard
              label="Bio"
              value={stats.field_completion.bio}
              points={15}
            />
            <FieldCompletionCard
              label="School"
              value={stats.field_completion.school}
              points={10}
            />
            <FieldCompletionCard
              label="Job Title"
              value={stats.field_completion.job_title}
              points={10}
            />
            <FieldCompletionCard
              label="Hometown"
              value={stats.field_completion.hometown}
              points={5}
            />
            <FieldCompletionCard
              label="Neighborhood"
              value={stats.field_completion.neighborhood}
              points={5}
            />
            <FieldCompletionCard
              label="Height"
              value={stats.field_completion.height}
              points={5}
            />
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

function FieldCompletionCard({
  label,
  value,
  points,
}: {
  label: string
  value: number
  points: number
}) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">{points} pts</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              value >= 70 ? "bg-green-500" : value >= 40 ? "bg-yellow-500" : "bg-red-500"
            )}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-900 w-12 text-right">
          {value.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}
