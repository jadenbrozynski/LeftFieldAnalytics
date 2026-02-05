"use client"

import * as React from "react"
import Link from "next/link"
import { ConversationDetail } from "@/lib/types"
import { fetchConversation } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime, formatRelativeTime } from "@/lib/utils"
import { Heart, HeartOff, ExternalLink, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConversationModalProps {
  matchId: string | null
  conversationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConversationModal({
  matchId,
  conversationId,
  open,
  onOpenChange,
}: ConversationModalProps) {
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
      // Reset state when closing
      setConversation(null)
      setError(null)
    }
  }, [open, idToFetch])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-4" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className={cn("h-12 w-3/4", i % 2 === 0 ? "" : "ml-auto")} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : conversation ? (
          <>
            {/* Header with both profiles */}
            <div className="flex items-center justify-between py-4 border-b">
              <ProfileBadge profile={conversation.profile1} />
              <div className="flex flex-col items-center gap-1">
                {conversation.status === 'active' ? (
                  <Heart className="h-5 w-5 text-pink-500" />
                ) : (
                  <HeartOff className="h-5 w-5 text-gray-400" />
                )}
                <Badge variant={conversation.status === 'active' ? 'success' : 'destructive'} className="text-xs">
                  {conversation.status === 'active' ? 'Active' : 'Unmatched'}
                </Badge>
              </div>
              <ProfileBadge profile={conversation.profile2} align="right" />
            </div>

            {/* Match info */}
            <div className="text-xs text-gray-500 text-center py-2">
              Matched {formatDateTime(conversation.created_at)}
              {conversation.unmatched_at && (
                <> · Unmatched {formatDateTime(conversation.unmatched_at)}</>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] pr-4">
              {conversation.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3 py-4">
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
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            isProfile1
                              ? "bg-gray-100 text-gray-900 rounded-tl-sm"
                              : "bg-[#00433a] text-white rounded-tr-sm"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-xs",
                            isProfile1 ? "text-gray-500" : "text-white/70"
                          )}>
                            <span>{formatRelativeTime(message.created_at)}</span>
                            {message.is_liked && (
                              <Heart className="h-3 w-3 fill-current text-pink-500" />
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
            </ScrollArea>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-gray-500">
                {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/profiles/${conversation.profile1.id}`} target="_blank">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {conversation.profile1.first_name}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/profiles/${conversation.profile2.id}`} target="_blank">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {conversation.profile2.first_name}
                  </Link>
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
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
        "flex items-center gap-3 hover:opacity-80",
        align === 'right' && "flex-row-reverse"
      )}
    >
      <Avatar className="h-10 w-10">
        {profile.photo_url && <AvatarImage src={profile.photo_url} />}
        <AvatarFallback>{profile.first_name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className={align === 'right' ? 'text-right' : ''}>
        <div className="font-medium text-gray-900">
          {profile.first_name} {profile.last_name}
        </div>
        <div className="text-xs text-gray-500">
          {profile.gender === 'nonbinary' ? 'Non-binary' : profile.gender === 'woman' ? 'Woman' : 'Man'}, {profile.age}
        </div>
      </div>
    </Link>
  )
}
