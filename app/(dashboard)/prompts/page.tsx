"use client"

import * as React from "react"
import { MessageSquare, Lock } from "lucide-react"
import { PromptDefinition } from "@/lib/types"
import { fetchPrompts } from "@/lib/api"
import { DataTable, Column } from "@/components/data-table"
import { StatsRow, StatItem } from "@/components/stats-row"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

export default function PromptsPage() {
  const [prompts, setPrompts] = React.useState<PromptDefinition[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadPrompts() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchPrompts()
        setPrompts(response.data)
      } catch (err) {
        console.error('Failed to load prompts:', err)
        setError(err instanceof Error ? err.message : 'Failed to load prompts')
      } finally {
        setLoading(false)
      }
    }

    loadPrompts()
  }, [])

  const activePrompts = prompts.filter((p) => !p.deleted_at)
  const deletedPrompts = prompts.filter((p) => p.deleted_at)
  const totalResponses = prompts.reduce((sum, p) => sum + (p.response_count || 0), 0)

  const stats: StatItem[] = [
    {
      label: "Total Prompts",
      value: prompts.length,
      icon: MessageSquare,
    },
    {
      label: "Active",
      value: activePrompts.length,
      change: `${deletedPrompts.length} deleted`,
      changeType: "neutral",
    },
    {
      label: "Total Responses",
      value: totalResponses.toLocaleString(),
    },
    {
      label: "Avg Responses",
      value: activePrompts.length > 0 ? Math.round(totalResponses / activePrompts.length) : 0,
      change: "per prompt",
      changeType: "neutral",
    },
  ]

  const columns: Column<PromptDefinition>[] = [
    {
      id: "prompt",
      header: "Prompt",
      cell: (prompt) => (
        <div className="max-w-md">
          <span className="text-gray-900">{prompt.prompt}</span>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: (prompt) => (
        prompt.category ? (
          <Badge variant="secondary" className="capitalize">
            {prompt.category}
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      id: "dates",
      header: "Active Period",
      cell: (prompt) => (
        <span className="text-sm text-gray-500">
          {prompt.start_date || prompt.end_date
            ? `${prompt.start_date ? formatDate(prompt.start_date) : "-"} to ${
                prompt.end_date ? formatDate(prompt.end_date) : "-"
              }`
            : "Always active"}
        </span>
      ),
    },
    {
      id: "responses",
      header: "Responses",
      sortable: true,
      cell: (prompt) => (
        <span className="text-gray-600">
          {prompt.response_count?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (prompt) => (
        prompt.deleted_at ? (
          <Badge variant="error">Deleted</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        )
      ),
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prompts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage profile prompts and questions
          </p>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-700">Failed to load prompts: {error}</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prompts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage profile prompts and questions
            <Badge variant="outline" className="ml-2">
              <Lock className="h-3 w-3 mr-1" />
              READ-ONLY
            </Badge>
          </p>
        </div>
        <Button disabled title="READ-ONLY mode">
          Add Prompt
        </Button>
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

      {/* Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={prompts}
          emptyMessage="No prompts found."
        />
      )}
    </div>
  )
}
