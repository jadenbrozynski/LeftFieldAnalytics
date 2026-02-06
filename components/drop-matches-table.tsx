"use client"

import * as React from "react"
import Link from "next/link"
import { DropMatch } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConversationSheet } from "@/components/conversation-sheet"
import { exportMatchProfiles } from "@/lib/api"
import { formatRelativeTime } from "@/lib/utils"
import { MessageSquare, Heart, HeartOff, Download } from "lucide-react"

interface DropMatchesTableProps {
  matches: DropMatch[]
  filter?: 'all' | 'active' | 'unmatched'
}

export function DropMatchesTable({ matches, filter = 'all' }: DropMatchesTableProps) {
  const [selectedMatch, setSelectedMatch] = React.useState<DropMatch | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [exportingId, setExportingId] = React.useState<string | null>(null)

  const handleExport = async (match: DropMatch) => {
    setExportingId(match.id)
    try {
      const fileName = `match-${match.profile1.first_name}-${match.profile2.first_name}.json`
      await exportMatchProfiles(match.id, fileName)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExportingId(null)
    }
  }

  const filteredMatches = React.useMemo(() => {
    if (filter === 'all') return matches
    return matches.filter(m => m.status === filter)
  }, [matches, filter])

  const handleViewConversation = (match: DropMatch) => {
    setSelectedMatch(match)
    setModalOpen(true)
  }

  if (filteredMatches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No {filter !== 'all' ? filter : ''} matches found.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 border-border hover:bg-gray-50/50">
              <TableHead className="font-medium text-gray-600">User 1</TableHead>
              <TableHead className="font-medium text-gray-600"></TableHead>
              <TableHead className="font-medium text-gray-600">User 2</TableHead>
              <TableHead className="font-medium text-gray-600">Status</TableHead>
              <TableHead className="font-medium text-gray-600">Messages</TableHead>
              <TableHead className="font-medium text-gray-600">Matched</TableHead>
              <TableHead className="font-medium text-gray-600"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMatches.map((match) => (
              <TableRow
                key={match.id}
                className="border-border cursor-pointer hover:bg-gray-50"
                onClick={() => handleViewConversation(match)}
              >
                <TableCell>
                  <ProfileCell profile={match.profile1} isUnmatcher={match.unmatched_by === 'profile1'} />
                </TableCell>
                <TableCell className="text-center">
                  {match.status === 'active' ? (
                    <Heart className="h-4 w-4 text-pink-500 mx-auto" />
                  ) : (
                    <HeartOff className="h-4 w-4 text-gray-400 mx-auto" />
                  )}
                </TableCell>
                <TableCell>
                  <ProfileCell profile={match.profile2} isUnmatcher={match.unmatched_by === 'profile2'} />
                </TableCell>
                <TableCell>
                  {match.status === 'active' ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Unmatched</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {match.conversation ? (
                    <div className="flex items-center gap-1 text-gray-600">
                      <MessageSquare className="h-4 w-4" />
                      <span>{match.conversation.message_count}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  {formatRelativeTime(match.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExport(match)}
                      disabled={exportingId === match.id}
                      title="Export match profiles as JSON"
                      className="h-8 w-8 p-0"
                    >
                      <Download className={`h-4 w-4 ${exportingId === match.id ? 'animate-pulse text-gray-300' : 'text-gray-500'}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewConversation(match)}
                      title="View conversation"
                      className="h-8 w-8 p-0"
                    >
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Link
                      href={`/profiles/${match.profile1.id}`}
                      title={`View ${match.profile1.first_name}'s profile`}
                      className="hover:opacity-80"
                    >
                      <Avatar className="h-7 w-7 border border-gray-200">
                        {match.profile1.photo_url && <AvatarImage src={match.profile1.photo_url} />}
                        <AvatarFallback className="text-xs">{match.profile1.first_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link
                      href={`/profiles/${match.profile2.id}`}
                      title={`View ${match.profile2.first_name}'s profile`}
                      className="hover:opacity-80"
                    >
                      <Avatar className="h-7 w-7 border border-gray-200">
                        {match.profile2.photo_url && <AvatarImage src={match.profile2.photo_url} />}
                        <AvatarFallback className="text-xs">{match.profile2.first_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConversationSheet
        matchId={selectedMatch?.id || null}
        conversationId={selectedMatch?.conversation?.id || null}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}

function ProfileCell({ profile, isUnmatcher }: { profile: DropMatch['profile1'], isUnmatcher: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        {profile.photo_url && <AvatarImage src={profile.photo_url} />}
        <AvatarFallback className="text-xs">
          {profile.first_name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium text-gray-900 text-sm flex items-center gap-1">
          {profile.first_name} {profile.last_name}
          {isUnmatcher && (
            <span className="text-xs text-red-500">(unmatched)</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {profile.gender === 'nonbinary' ? 'NB' : profile.gender === 'woman' ? 'W' : 'M'}, {profile.age}
        </div>
      </div>
    </div>
  )
}
