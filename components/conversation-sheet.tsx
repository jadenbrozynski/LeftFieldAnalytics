"use client"

import * as React from "react"
import Link from "next/link"
import { ConversationDetail } from "@/lib/types"
import { fetchConversation } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime, formatRelativeTime } from "@/lib/utils"
import { Heart, HeartOff, ExternalLink, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConversationSheetProps {
  matchId: string | null
  conversationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConversationSheet({
  matchId,
  conversationId,
  open,
  onOpenChange,
}: ConversationSheetProps) {
  const [conversation, setConversation] = React.useState<ConversationDetail | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const idToFetch = conversationId || matchId

  React.useEffect(() => {
    if (open && idToFetch) {
      setLoading(true)
      setError(null)
      fetchConversation(idToFetch)
        .then(setConversation)
        .catch(err => {
          console.error('Failed to load conversation:', err)
          setError(err instanceof Error ? err.message : 'Failed to load conversation')
        })
        .finally(() => setLoading(false))
    } else if (!open) {
      setConversation(null)
      setError(null)
    }
  }, [open, idToFetch])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </div>
            <div className="space-y-3 pt-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className={cn("h-14 w-3/4 rounded-2xl", i % 2 === 0 ? "" : "ml-auto")} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : conversation ? (
          <>
            {/* Header with both profiles */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <ProfileBadge profile={conversation.profile1} />
                <div className="flex flex-col items-center">
                  {conversation.status === 'active' ? (
                    <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                  ) : (
                    <HeartOff className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <ProfileBadge profile={conversation.profile2} align="right" />
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge variant={conversation.status === 'active' ? 'success' : 'destructive'}>
                  {conversation.status === 'active' ? 'Active Match' : 'Unmatched'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Matched {formatDateTime(conversation.created_at)}
                {conversation.unmatched_at && (
                  <span className="text-red-500"> · Unmatched {formatDateTime(conversation.unmatched_at)}</span>
                )}
              </p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {conversation.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">This match hasn&apos;t started chatting</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conversation.messages.map((message) => {
                      const isProfile1 = message.sender_id === conversation.profile1.id
                      const sender = isProfile1 ? conversation.profile1 : conversation.profile2

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-2",
                            isProfile1 ? "justify-start" : "justify-end"
                          )}
                        >
                          {isProfile1 && (
                            <Avatar className="h-8 w-8 shrink-0">
                              {sender.photo_url && <AvatarImage src={sender.photo_url} />}
                              <AvatarFallback className="text-xs">
                                {sender.first_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2.5",
                              isProfile1
                                ? "bg-gray-100 text-gray-900 rounded-bl-sm"
                                : "bg-[#00433a] text-white rounded-br-sm"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {message.content}
                            </p>
                            <div className={cn(
                              "flex items-center gap-1.5 mt-1 text-xs",
                              isProfile1 ? "text-gray-400" : "text-white/60"
                            )}>
                              <span>{formatRelativeTime(message.created_at)}</span>
                              {message.is_liked && (
                                <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
                              )}
                            </div>
                          </div>
                          {!isProfile1 && (
                            <Avatar className="h-8 w-8 shrink-0">
                              {sender.photo_url && <AvatarImage src={sender.photo_url} />}
                              <AvatarFallback className="text-xs">
                                {sender.first_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-white">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/profiles/${conversation.profile1.id}`}>
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      {conversation.profile1.first_name}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/profiles/${conversation.profile2.id}`}>
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      {conversation.profile2.first_name}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function ProfileBadge({
  profile,
  align = 'left',
}: {
  profile: ConversationDetail['profile1']
  align?: 'left' | 'right'
}) {
  return (
    <Link
      href={`/profiles/${profile.id}`}
      className={cn(
        "flex items-center gap-3 hover:opacity-80 transition-opacity",
        align === 'right' && "flex-row-reverse"
      )}
    >
      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
        {profile.photo_url && <AvatarImage src={profile.photo_url} />}
        <AvatarFallback>{profile.first_name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className={align === 'right' ? 'text-right' : ''}>
        <div className="font-medium text-gray-900">
          {profile.first_name}
        </div>
        <div className="text-xs text-gray-500">
          {profile.gender === 'nonbinary' ? 'NB' : profile.gender === 'woman' ? 'W' : 'M'}, {profile.age}
        </div>
        <div className="text-xs text-gray-400">
          {profile.last_seen_at ? (
            <>Last seen {formatRelativeTime(profile.last_seen_at)}</>
          ) : (
            <span className="text-gray-300">Never seen</span>
          )}
        </div>
      </div>
    </Link>
  )
}
