"use client"

import * as React from "react"
import { ConversationLogEntry } from "@/lib/types"
import { fetchConversations } from "@/lib/api"
import { MessagesTable } from "@/components/messages-table"
import { MessagingAnalytics } from "@/components/messaging-analytics"
import { ConversationSheet } from "@/components/conversation-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, List, BarChart3 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ViewMode = 'log' | 'analytics'

export default function MessagesPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>('log')
  const [conversations, setConversations] = React.useState<ConversationLogEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)

  // Filter state
  const [period, setPeriod] = React.useState('all')
  const [contactShared, setContactShared] = React.useState('all')
  const [status, setStatus] = React.useState('all')
  const [hasPlans, setHasPlans] = React.useState('all')

  // Conversation sheet state
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [period, contactShared, status, hasPlans])

  // Fetch conversations when in log view
  React.useEffect(() => {
    if (viewMode !== 'log') return

    async function loadConversations() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchConversations({
          search: debouncedSearch || undefined,
          page,
          per_page: 50,
          period: period !== 'all' ? period : undefined,
          contact_shared: contactShared !== 'all' ? contactShared : undefined,
          status: status !== 'all' ? status : undefined,
          has_plans: hasPlans !== 'all' ? hasPlans : undefined,
        })
        setConversations(response.data)
        setTotalPages(response.pagination.total_pages)
        setTotal(response.pagination.total)
      } catch (err) {
        console.error('Failed to load conversations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load conversations')
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [viewMode, debouncedSearch, page, period, contactShared, status, hasPlans])

  const handleRowClick = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setSheetOpen(true)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(1, page - 1))}
              className={cn(page === 1 && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <span className="px-2 text-gray-400">...</span>
                </PaginationItem>
              )}
            </>
          )}
          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                onClick={() => setPage(p)}
                isActive={p === page}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <span className="px-2 text-gray-400">...</span>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => setPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              className={cn(page === totalPages && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === 'log'
              ? `${total.toLocaleString()} conversations`
              : 'Messaging analytics and trends'
            }
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <Button
            variant={viewMode === 'log' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('log')}
            className={cn(
              "gap-2",
              viewMode === 'log'
                ? "bg-white shadow-sm text-gray-900 hover:bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-transparent"
            )}
          >
            <List className="h-4 w-4" />
            Conversations
          </Button>
          <Button
            variant={viewMode === 'analytics' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('analytics')}
            className={cn(
              "gap-2",
              viewMode === 'analytics'
                ? "bg-white shadow-sm text-gray-900 hover:bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-transparent"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>

      {viewMode === 'log' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search names or messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Time Period */}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="60">Last 60 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Contact Shared */}
            <Select value={contactShared} onValueChange={setContactShared}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Contact shared" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="yes">Contact Shared</SelectItem>
                <SelectItem value="no">No Contact</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
              </SelectContent>
            </Select>

            {/* Has Plans */}
            <Select value={hasPlans} onValueChange={setHasPlans}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Convos</SelectItem>
                <SelectItem value="yes">Has Plans</SelectItem>
                <SelectItem value="no">No Plans</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {(period !== 'all' || contactShared !== 'all' || status !== 'all' || hasPlans !== 'all' || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPeriod('all')
                  setContactShared('all')
                  setStatus('all')
                  setHasPlans('all')
                  setSearch('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Conversations Table */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-6">
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <MessagesTable conversations={conversations} onRowClick={handleRowClick} />
              {renderPagination()}
            </>
          )}
        </>
      ) : (
        <MessagingAnalytics />
      )}

      {/* Conversation Sheet */}
      <ConversationSheet
        matchId={null}
        conversationId={selectedConversationId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
