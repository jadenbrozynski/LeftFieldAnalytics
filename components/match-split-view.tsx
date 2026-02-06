"use client"

import * as React from "react"
import Link from "next/link"
import { Profile } from "@/lib/types"
import { DropMatch } from "@/lib/types"
import { fetchProfile } from "@/lib/api"
import { ProfileView } from "@/components/profile-view"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn, formatDate, formatRelativeTime } from "@/lib/utils"
import {
  Heart,
  HeartOff,
  ExternalLink,
  MessageSquare,
} from "lucide-react"

interface MatchSplitViewProps {
  match: DropMatch | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MatchSplitView({ match, open, onOpenChange }: MatchSplitViewProps) {
  const [profile1, setProfile1] = React.useState<Profile | null>(null)
  const [profile2, setProfile2] = React.useState<Profile | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open && match) {
      setLoading(true)
      setError(null)
      setProfile1(null)
      setProfile2(null)

      Promise.all([
        fetchProfile(match.profile1.id),
        fetchProfile(match.profile2.id),
      ])
        .then(([p1, p2]) => {
          setProfile1(p1)
          setProfile2(p2)
        })
        .catch(err => {
          console.error('Failed to load profiles:', err)
          setError(err instanceof Error ? err.message : 'Failed to load profiles')
        })
        .finally(() => setLoading(false))
    } else if (!open) {
      setProfile1(null)
      setProfile2(null)
      setError(null)
    }
  }, [open, match])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pr-14 py-4 border-b bg-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Match Comparison
            </DialogTitle>
            {match && (
              <div className="flex items-center gap-2">
                {match.status === 'active' ? (
                  <Badge variant="success" className="gap-1">
                    <Heart className="h-3 w-3 fill-current" />
                    Active Match
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <HeartOff className="h-3 w-3" />
                    Unmatched
                  </Badge>
                )}
                {match.conversation && match.conversation.message_count > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {match.conversation.message_count} messages
                  </Badge>
                )}
              </div>
            )}
          </div>
          {match && (
            <span className="text-sm text-gray-500">
              Matched {formatDate(match.created_at)}
            </span>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex">
            <SplitPaneSkeleton />
            <div className="w-px bg-border flex-shrink-0" />
            <SplitPaneSkeleton />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : profile1 && profile2 ? (
          <div className="flex-1 flex min-h-0">
            {/* Profile 1 */}
            <div className="flex-1 flex flex-col min-w-0">
              <ProfileHeader
                profile={match!.profile1}
                fullProfile={profile1}
                isUnmatcher={match!.unmatched_by === 'profile1'}
              />
              <ScrollArea className="flex-1">
                <div className="p-5">
                  <ProfileView
                    profile={profile1}
                    showActions={false}
                    showFullProfileLink={false}
                  />
                </div>
              </ScrollArea>
            </div>

            {/* Center divider */}
            <div className="w-px bg-border flex-shrink-0 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="h-10 w-10 rounded-full bg-white border-2 border-border flex items-center justify-center shadow-sm">
                  {match!.status === 'active' ? (
                    <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                  ) : (
                    <HeartOff className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Profile 2 */}
            <div className="flex-1 flex flex-col min-w-0">
              <ProfileHeader
                profile={match!.profile2}
                fullProfile={profile2}
                isUnmatcher={match!.unmatched_by === 'profile2'}
              />
              <ScrollArea className="flex-1">
                <div className="p-5">
                  <ProfileView
                    profile={profile2}
                    showActions={false}
                    showFullProfileLink={false}
                  />
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        {profile1 && profile2 && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50/50 flex-shrink-0">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/profiles/${profile1.id}`}>
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  {profile1.first_name}&apos;s Full Profile
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/profiles/${profile2.id}`}>
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  {profile2.first_name}&apos;s Full Profile
                </Link>
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ProfileHeader({
  profile,
  fullProfile,
  isUnmatcher,
}: {
  profile: DropMatch['profile1']
  fullProfile: Profile
  isUnmatcher: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-gray-50/80 border-b flex-shrink-0">
      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
        {profile.photo_url && <AvatarImage src={profile.photo_url} />}
        <AvatarFallback>{profile.first_name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">
            {profile.first_name} {profile.last_name}
          </span>
          <span className="text-sm text-gray-500">
            {profile.age}
          </span>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              fullProfile.status === 'live' && "bg-green-50 text-green-700",
              fullProfile.status === 'banned' && "bg-red-50 text-red-700",
              fullProfile.status === 'waitlisted' && "bg-yellow-50 text-yellow-700",
            )}
          >
            {fullProfile.status}
          </Badge>
          {isUnmatcher && (
            <Badge variant="destructive" className="text-xs">
              Unmatched
            </Badge>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {fullProfile.geolocation?.city
            ? `${fullProfile.geolocation.city}, ${fullProfile.geolocation.region}`
            : fullProfile.neighborhood || 'No location'}
          {fullProfile.job_title && ` · ${fullProfile.job_title}`}
        </div>
      </div>
    </div>
  )
}

function SplitPaneSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-32 mb-1.5" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-48 w-40 rounded-xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}
