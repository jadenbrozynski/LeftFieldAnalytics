"use client"

import * as React from "react"
import Link from "next/link"
import { DropMatchRequest } from "@/lib/types"
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
import { formatRelativeTime } from "@/lib/utils"
import { ArrowRight, ExternalLink } from "lucide-react"

interface DropRequestsTableProps {
  requests: DropMatchRequest[]
  statusFilter?: string
}

export function DropRequestsTable({ requests, statusFilter }: DropRequestsTableProps) {
  const filteredRequests = React.useMemo(() => {
    if (!statusFilter || statusFilter === 'all') return requests
    return requests.filter(r => r.status === statusFilter)
  }, [requests, statusFilter])

  if (filteredRequests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No {statusFilter && statusFilter !== 'all' ? statusFilter : ''} requests found.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 border-border hover:bg-gray-50/50">
            <TableHead className="font-medium text-gray-600">Sender</TableHead>
            <TableHead className="font-medium text-gray-600"></TableHead>
            <TableHead className="font-medium text-gray-600">Receiver</TableHead>
            <TableHead className="font-medium text-gray-600">Status</TableHead>
            <TableHead className="font-medium text-gray-600">Type</TableHead>
            <TableHead className="font-medium text-gray-600">Sent</TableHead>
            <TableHead className="font-medium text-gray-600"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.map((request) => (
            <TableRow key={request.id} className="border-border">
              <TableCell>
                <ProfileCell profile={request.sender} />
              </TableCell>
              <TableCell className="text-center">
                <ArrowRight className="h-4 w-4 text-gray-400 mx-auto" />
              </TableCell>
              <TableCell>
                <ProfileCell profile={request.receiver} />
              </TableCell>
              <TableCell>
                <StatusBadge status={request.status} />
              </TableCell>
              <TableCell className="text-gray-600 text-sm">
                {request.kind || '—'}
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {formatRelativeTime(request.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/profiles/${request.sender.id}`}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/profiles/${request.receiver.id}`}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ProfileCell({ profile }: { profile: DropMatchRequest['sender'] }) {
  return (
    <Link
      href={`/profiles/${profile.id}`}
      className="flex items-center gap-2 hover:opacity-80"
    >
      <Avatar className="h-8 w-8">
        {profile.photo_url && <AvatarImage src={profile.photo_url} />}
        <AvatarFallback className="text-xs">
          {profile.first_name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium text-gray-900 text-sm">
          {profile.first_name} {profile.last_name}
        </div>
        <div className="text-xs text-gray-500">
          {profile.gender === 'nonbinary' ? 'NB' : profile.gender === 'woman' ? 'W' : 'M'}, {profile.age}
        </div>
      </div>
    </Link>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">Unknown</Badge>

  switch (status.toLowerCase()) {
    case 'accepted':
      return <Badge variant="success">Accepted</Badge>
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    case 'expired':
      return <Badge variant="outline">Expired</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
