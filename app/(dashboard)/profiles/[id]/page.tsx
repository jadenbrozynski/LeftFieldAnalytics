"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  MapPin,
  Briefcase,
  GraduationCap,
  Home,
  Calendar,
  Phone,
  Mail,
  Clock,
  Shield,
  Play,
} from "lucide-react"
import { fetchProfile } from "@/lib/api"
import { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn, formatDate, formatDateTime, formatHeight, getStatusColor, getGenderLabel, formatPhoneNumber } from "@/lib/utils"

export default function ProfileDetailPage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id as string

  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0)

  React.useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchProfile(profileId)
        setProfile(data)
      } catch (err) {
        console.error('Failed to load profile:', err)
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [profileId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" disabled>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to profiles
        </Button>
        <div className="flex gap-6">
          <Skeleton className="h-80 w-64 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-medium text-gray-900">
          {error === 'Profile not found' ? 'Profile not found' : 'Error loading profile'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {error === 'Profile not found'
            ? "The profile you're looking for doesn't exist."
            : error || "An unexpected error occurred."}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    )
  }

  const sortedUploads = [...profile.uploads].sort((a, b) => a.display_order - b.display_order)
  const currentUpload = sortedUploads[currentPhotoIndex]
  const location = profile.geolocation
    ? [profile.geolocation.city, profile.geolocation.region].filter(Boolean).join(", ")
    : profile.neighborhood

  const goToPrevious = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? sortedUploads.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentPhotoIndex((prev) => (prev === sortedUploads.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/profiles">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to profiles
        </Link>
      </Button>

      {/* Main Profile Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left - Photos */}
        <div className="lg:w-72 flex-shrink-0 space-y-3">
          {/* Main Photo */}
          <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">
            {sortedUploads.length > 0 ? (
              <>
                {currentUpload?.type === "video" ? (
                  <video
                    src={currentUpload.url}
                    className="absolute inset-0 w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <Image
                    src={currentUpload?.url || ''}
                    alt={`${profile.first_name}'s photo`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
                {/* Navigation */}
                {sortedUploads.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToPrevious}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-0.5 text-xs text-white">
                      {currentPhotoIndex + 1}/{sortedUploads.length}
                    </div>
                  </>
                )}
                {currentUpload?.type === "video" && (
                  <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                    <Play className="h-3 w-3 text-white fill-white" />
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No photos
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {sortedUploads.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sortedUploads.map((upload, index) => (
                <button
                  key={upload.id}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={cn(
                    "relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden",
                    index === currentPhotoIndex
                      ? "ring-2 ring-primary ring-offset-1"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  {upload.type === "video" ? (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <Play className="h-3 w-3 text-gray-500" />
                    </div>
                  ) : (
                    <Image
                      src={upload.url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right - Profile Info */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardContent className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {profile.first_name} {profile.last_name}, {profile.age}
                  </h1>
                  {profile.pronouns && (
                    <p className="text-sm text-gray-500">{profile.pronouns}</p>
                  )}
                  {location && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>
                <Badge className={cn(getStatusColor(profile.status), "text-sm")}>
                  {profile.status}
                </Badge>
              </div>

              <Separator />

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Gender</span>
                  <p className="font-medium">{getGenderLabel(profile.gender)}</p>
                </div>
                {profile.height && (
                  <div>
                    <span className="text-gray-500">Height</span>
                    <p className="font-medium">{formatHeight(profile.height)}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Birthday</span>
                  <p className="font-medium">{formatDate(profile.birthday)}</p>
                </div>
                {profile.neighborhood && (
                  <div>
                    <span className="text-gray-500">Neighborhood</span>
                    <p className="font-medium">{profile.neighborhood}</p>
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Bio</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
                  </div>
                </>
              )}

              {/* Work & Education */}
              {(profile.job_title || profile.school || profile.hometown) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {profile.job_title && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span>{profile.job_title}</span>
                      </div>
                    )}
                    {profile.school && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        <span>{profile.school}</span>
                      </div>
                    )}
                    {profile.hometown && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Home className="h-4 w-4 text-gray-400" />
                        <span>From {profile.hometown}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Interests & Activities */}
              {(profile.interests.length > 0 || profile.activities.length > 0) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {profile.interests.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Interests</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.interests.map((interest) => (
                            <Badge key={interest.id} variant="secondary" className="text-xs">
                              {interest.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.activities.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Activities</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.activities.map((activity) => (
                            <Badge key={activity.id} variant="outline" className="text-xs">
                              {activity.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Account Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{formatPhoneNumber(profile.user.phone)}</span>
                </div>
                {profile.user.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{profile.user.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
                {profile.user.last_seen_at && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Last seen {formatDateTime(profile.user.last_seen_at)}</span>
                  </div>
                )}
                {profile.user.referral_code && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span>Referral: {profile.user.referral_code}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-400 pt-2">
                Profile ID: {profile.id}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Tabs - Compact */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Activity</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-3">
          <Card>
            <CardContent className="py-6">
              <div className="text-center text-gray-500">
                <Activity className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Activity timeline coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-3">
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-gray-500 text-center">
                No reports filed against this profile
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="mt-3">
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-gray-500 text-center">
                Match history coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
