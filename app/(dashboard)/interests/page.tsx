"use client"

import * as React from "react"
import { Heart, Activity, Lock } from "lucide-react"
import { Interest, Activity as ActivityType } from "@/lib/types"
import { fetchInterests, fetchActivities } from "@/lib/api"
import { DataTable, Column } from "@/components/data-table"
import { StatsRow, StatItem } from "@/components/stats-row"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function InterestsPage() {
  const [interests, setInterests] = React.useState<Interest[]>([])
  const [activities, setActivities] = React.useState<ActivityType[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const [interestsRes, activitiesRes] = await Promise.all([
          fetchInterests(),
          fetchActivities(),
        ])
        setInterests(interestsRes.data)
        setActivities(activitiesRes.data)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Group interests by category
  const interestsByCategory = React.useMemo(() => {
    const grouped: Record<string, Interest[]> = {}
    interests.forEach((interest) => {
      const cat = interest.category || "uncategorized"
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(interest)
    })
    return grouped
  }, [interests])

  const totalInterestUsage = interests.reduce((sum, i) => sum + (i.usage_count || 0), 0)
  const totalActivityUsage = activities.reduce((sum, a) => sum + (a.usage_count || 0), 0)

  const stats: StatItem[] = [
    {
      label: "Total Interests",
      value: interests.length,
      icon: Heart,
    },
    {
      label: "Interest Usage",
      value: totalInterestUsage.toLocaleString(),
      change: "total selections",
      changeType: "neutral",
    },
    {
      label: "Total Activities",
      value: activities.length,
      icon: Activity,
    },
    {
      label: "Activity Usage",
      value: totalActivityUsage.toLocaleString(),
      change: "total selections",
      changeType: "neutral",
    },
  ]

  const interestColumns: Column<Interest>[] = [
    {
      id: "name",
      header: "Name",
      cell: (interest) => (
        <span className="font-medium text-gray-900">{interest.name}</span>
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: (interest) => (
        interest.category ? (
          <Badge variant="secondary" className="capitalize">
            {interest.category}
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      id: "usage",
      header: "Usage Count",
      sortable: true,
      cell: (interest) => (
        <span className="text-gray-600">
          {interest.usage_count?.toLocaleString() || 0}
        </span>
      ),
    },
  ]

  const activityColumns: Column<ActivityType>[] = [
    {
      id: "name",
      header: "Name",
      cell: (activity) => (
        <span className="font-medium text-gray-900">{activity.name}</span>
      ),
    },
    {
      id: "url",
      header: "Icon URL",
      cell: (activity) => (
        <span className="text-sm text-gray-500 font-mono">{activity.url}</span>
      ),
    },
    {
      id: "usage",
      header: "Usage Count",
      sortable: true,
      cell: (activity) => (
        <span className="text-gray-600">
          {activity.usage_count?.toLocaleString() || 0}
        </span>
      ),
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Interests & Activities</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage profile interests and activities
          </p>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-700">Failed to load data: {error}</p>
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
        <h1 className="text-2xl font-semibold text-gray-900">Interests & Activities</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage profile interests and activities
          <Badge variant="outline" className="ml-2">
            <Lock className="h-3 w-3 mr-1" />
            READ-ONLY
          </Badge>
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
        <StatsRow stats={stats} />
      )}

      {/* Tabs */}
      <Tabs defaultValue="interests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="interests">Interests</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        {/* Interests Tab */}
        <TabsContent value="interests" className="space-y-6">
          <div className="flex justify-end">
            <Button disabled title="READ-ONLY mode">
              Add Interest
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-4" />
                    <div className="flex flex-wrap gap-2">
                      {[...Array(4)].map((_, j) => (
                        <Skeleton key={j} className="h-6 w-16" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Interests by Category */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(interestsByCategory).map(([category, categoryInterests]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium capitalize flex items-center justify-between">
                        {category}
                        <Badge variant="secondary">{categoryInterests.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {categoryInterests.map((interest) => (
                          <Badge
                            key={interest.id}
                            variant="outline"
                            className="cursor-default"
                          >
                            {interest.name}
                            <span className="ml-1 text-gray-400">
                              ({interest.usage_count || 0})
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Full Table */}
              <DataTable
                columns={interestColumns}
                data={interests}
                emptyMessage="No interests found."
              />
            </>
          )}
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6">
          <div className="flex justify-end">
            <Button disabled title="READ-ONLY mode">
              Add Activity
            </Button>
          </div>

          {/* Activities Table */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              columns={activityColumns}
              data={activities}
              emptyMessage="No activities found."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
