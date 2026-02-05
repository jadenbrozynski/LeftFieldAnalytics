"use client"

import * as React from "react"
import Link from "next/link"
import { ProfileChange } from "@/lib/types"
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface TimelineViewProps {
  changes: ProfileChange[]
  loading?: boolean
  showProfile?: boolean
  className?: string
}

export function TimelineView({
  changes,
  loading = false,
  showProfile = true,
  className,
}: TimelineViewProps) {
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0 bg-gray-100" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 bg-gray-100" />
              <Skeleton className="h-4 w-2/3 bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (changes.length === 0) {
    return (
      <div className={cn("text-center py-8 text-gray-500", className)}>
        No changes recorded
      </div>
    )
  }

  return (
    <div className={cn("space-y-0", className)}>
      {changes.map((change, index) => {
        const isLast = index === changes.length - 1
        const profile = change.profile

        return (
          <div key={change.id} className="relative flex gap-4 pb-6">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-200" />
            )}

            {/* Avatar */}
            {showProfile && profile ? (
              <Link href={`/profiles/${profile.id}`} className="flex-shrink-0">
                <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
              </Link>
            ) : (
              <Skeleton className="h-10 w-10 rounded-full bg-gray-100" />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {showProfile && profile && (
                  <Link
                    href={`/profiles/${profile.id}`}
                    className="font-medium text-gray-900 hover:text-[#00433a]"
                  >
                    {profile.first_name} {profile.last_name}
                  </Link>
                )}
                <span className="text-gray-500">changed</span>
                <Badge variant="outline" className="font-mono text-xs border-border">
                  {change.field}
                </Badge>
              </div>

              <div className="flex flex-col gap-1 text-sm">
                {change.old_value && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 w-12 flex-shrink-0">From:</span>
                    <span className="text-gray-500 line-through break-all">
                      {change.old_value}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 w-12 flex-shrink-0">To:</span>
                  <span className="text-gray-900 break-all">
                    {change.new_value || <em className="text-gray-400">empty</em>}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span title={formatDateTime(change.changed_at)}>
                  {formatRelativeTime(change.changed_at)}
                </span>
                {change.changed_by && (
                  <>
                    <span>•</span>
                    <span>by {change.changed_by}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
