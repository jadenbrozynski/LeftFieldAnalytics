"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, AlertTriangle, MessageSquare, Image as ImageIcon, Lock, ZoomIn } from "lucide-react"
import { fetchReport } from "@/lib/api"
import { ProfileReport } from "@/lib/types"
import { ProfileView } from "@/components/profile-view"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime, formatPhoneNumber } from "@/lib/utils"
import { ImageLightbox } from "@/components/image-lightbox"

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [report, setReport] = React.useState<ProfileReport | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [reviewerNotes, setReviewerNotes] = React.useState("")
  const [lightboxOpen, setLightboxOpen] = React.useState(false)

  React.useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchReport(reportId)
        setReport(data)
        setReviewerNotes(data.reviewer_notes || "")
      } catch (err) {
        console.error('Failed to load report:', err)
        setError(err instanceof Error ? err.message : 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [reportId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" disabled>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to reports
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-medium text-gray-900">
          {error === 'Report not found' ? 'Report not found' : 'Error loading report'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {error === 'Report not found'
            ? "The report you're looking for doesn't exist."
            : error || "An unexpected error occurred."}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/reports">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to reports
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Report #{report.id}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Filed {formatDateTime(report.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Lock className="h-3 w-3 mr-1" />
            READ-ONLY
          </Badge>
          <Badge variant={report.is_resolved ? "success" : "warning"} className="text-sm">
            {report.is_resolved ? "Resolved" : "Unresolved"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Report Details */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Report Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Reporter */}
              <div>
                <Label className="text-gray-500">Reported By</Label>
                {report.reporter ? (
                  <Link
                    href={`/profiles/${report.reporter.id}`}
                    className="flex items-center gap-3 mt-2 p-2 -mx-2 rounded-lg hover:bg-gray-50"
                  >
                    <Avatar className="h-10 w-10">
                      {report.reporter.uploads?.[0] ? (
                        <AvatarImage src={report.reporter.uploads[0].url} />
                      ) : null}
                      <AvatarFallback>
                        {report.reporter.first_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">
                        {report.reporter.first_name} {report.reporter.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.reporter.user?.phone ? formatPhoneNumber(report.reporter.user.phone) : "Unknown"}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="mt-2 p-3 rounded-lg bg-gray-50 flex items-center gap-2">
                    <Badge variant="outline">System Flagged</Badge>
                    <span className="text-sm text-gray-500">
                      Automatically detected by the system
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Reporter Notes */}
              <div>
                <Label className="text-gray-500">Report Reason</Label>
                <div className="mt-2 p-3 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-700">
                    {report.reporter_notes || "No notes provided"}
                  </p>
                </div>
              </div>

              {/* Reported Content */}
              {report.reported_upload && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-gray-500 flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      Reported Content
                    </Label>
                    <button
                      onClick={() => setLightboxOpen(true)}
                      className="mt-2 relative aspect-square w-48 rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
                    >
                      <Image
                        src={report.reported_upload.url}
                        alt="Reported content"
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  </div>
                  <ImageLightbox
                    src={report.reported_upload.url}
                    alt="Reported content"
                    open={lightboxOpen}
                    onOpenChange={setLightboxOpen}
                  />
                </>
              )}

              {report.conversation_id && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-gray-500 flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Conversation
                    </Label>
                    <div className="mt-2 p-3 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-500">
                        Conversation ID: {report.conversation_id}
                      </p>
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1" disabled>
                        View conversation (coming soon)
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Admin Actions
                <Badge variant="outline" className="ml-2">
                  <Lock className="h-3 w-3 mr-1" />
                  READ-ONLY
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Reviewer Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this report..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="mt-2"
                  rows={4}
                  disabled
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button disabled title="READ-ONLY mode">
                  Mark Resolved
                </Button>
                <Button variant="destructive" disabled title="READ-ONLY mode">
                  Ban User
                </Button>
                <Button variant="outline" disabled title="READ-ONLY mode">
                  Save Notes
                </Button>
              </div>

              {report.reviewer_notes && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm font-medium text-green-800">Previous Review</p>
                  <p className="text-sm text-green-700 mt-1">{report.reviewer_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reported Profile - Now with more space */}
        <div>
          <Card className="h-fit lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Reported Profile</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ProfileView profile={report.reported} showActions={false} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
