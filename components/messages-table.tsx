"use client"

import * as React from "react"
import Link from "next/link"
import { ConversationLogEntry } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatRelativeTime } from "@/lib/utils"
import { MessageSquare, Heart, CalendarCheck } from "lucide-react"

interface MessagesTableProps {
  conversations: ConversationLogEntry[]
  onRowClick: (conversationId: string) => void
}

export function MessagesTable({ conversations, onRowClick }: MessagesTableProps) {
  const truncateContent = (content: string, maxLength = 40) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Participants</TableHead>
            <TableHead>Last Message</TableHead>
            <TableHead className="w-[100px] text-center">Messages</TableHead>
            <TableHead className="w-[120px]">Last Active</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                No conversations found.
              </TableCell>
            </TableRow>
          ) : (
            conversations.map((conv) => {
              const lastSender = conv.last_message_sender_id === conv.profile1.id
                ? conv.profile1
                : conv.profile2

              return (
                <TableRow
                  key={conv.conversation_id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onRowClick(conv.conversation_id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <Link
                          href={`/profiles/${conv.profile1.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="relative z-10 hover:z-20"
                        >
                          <Avatar className="h-9 w-9 border-2 border-white">
                            {conv.profile1.photo_url && (
                              <AvatarImage src={conv.profile1.photo_url} />
                            )}
                            <AvatarFallback className="text-xs">
                              {conv.profile1.first_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <Link
                          href={`/profiles/${conv.profile2.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="relative hover:z-20"
                        >
                          <Avatar className="h-9 w-9 border-2 border-white">
                            {conv.profile2.photo_url && (
                              <AvatarImage src={conv.profile2.photo_url} />
                            )}
                            <AvatarFallback className="text-xs">
                              {conv.profile2.first_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 text-sm">
                          {conv.profile1.first_name} & {conv.profile2.first_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {conv.profile1.last_name.charAt(0)}. & {conv.profile2.last_name.charAt(0)}.
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-gray-400">
                        {lastSender.first_name}:
                      </span>
                      <span className="text-gray-700 text-sm">
                        {truncateContent(conv.last_message_content)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {conv.message_count}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-500 text-sm">
                      {formatRelativeTime(conv.last_message_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={conv.status === 'active' ? 'success' : 'destructive'}
                        className="text-xs"
                      >
                        {conv.status === 'active' ? 'Active' : 'Unmatched'}
                      </Badge>
                      {conv.has_potential_plans && (
                        <span title="Potential plans detected">
                          <CalendarCheck className="h-4 w-4 text-emerald-500" />
                        </span>
                      )}
                      {conv.contact_exchanged && (
                        <span title="Contact shared">
                          <Heart className="h-4 w-4 fill-amber-400 text-amber-400" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
