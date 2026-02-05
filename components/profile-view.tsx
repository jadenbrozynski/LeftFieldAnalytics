"use client"

import * as React from "react"
import Link from "next/link"
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Home,
  Calendar,
  Phone,
  Mail,
  Clock,
  Shield,
  Ban,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { Profile } from "@/lib/types"
import { cn, formatDate, formatDateTime, formatHeight, getStatusColor, getGenderLabel, formatPhoneNumber } from "@/lib/utils"
import { PhotoGallery } from "@/components/photo-gallery"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProfileViewProps {
  profile: Profile
  onStatusChange?: (status: Profile["status"]) => void
  onBan?: () => void
  showActions?: boolean
  showFullProfileLink?: boolean
  className?: string
}

export function ProfileView({
  profile,
  onStatusChange,
  onBan,
  showActions = true,
  showFullProfileLink = false,
  className,
}: ProfileViewProps) {
  const location = profile.geolocation
    ? [profile.geolocation.city, profile.geolocation.region]
        .filter(Boolean)
        .join(", ")
    : profile.neighborhood

  return (
    <div className={cn("h-full overflow-y-auto", className)}>
      {/* Two-column layout on wider screens */}
      <div className="flex flex-col lg:flex-row gap-6 p-1">
        {/* Left column - Photos (constrained height) */}
        <div className="lg:w-64 lg:flex-shrink-0">
          <div className="lg:sticky lg:top-0 space-y-3">
            <PhotoGallery uploads={profile.uploads} compact />
            {/* View Full Profile Button */}
            {showFullProfileLink && (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/profiles/${profile.id}`}>
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View Full Profile
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Right column - Info */}
        <div className="flex-1 space-y-5 min-w-0">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile.first_name} {profile.last_name}, {profile.age}
                </h2>
                {profile.pronouns && (
                  <p className="text-sm text-gray-500">{profile.pronouns}</p>
                )}
              </div>
              <Badge className={cn(getStatusColor(profile.status), "flex-shrink-0")}>
                {profile.status}
              </Badge>
            </div>
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Change Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => onStatusChange?.("live")}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Set Live
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange?.("waitlisted")}>
                    <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                    Set Waitlisted
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onStatusChange?.("banned")}
                    className="text-red-600"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Ban User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {profile.needs_manual_review && (
                <Button variant="default" size="sm">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              )}
            </div>
          )}

          {/* Review Alert */}
          {profile.needs_manual_review && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>This profile needs manual review</span>
            </div>
          )}

          <Separator />

          {/* Basic Info - Compact grid */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Basic Info</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
          </div>

          {/* Bio */}
          {profile.bio && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Bio</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
              </div>
            </>
          )}

          {/* Work & Education */}
          {(profile.job_title || profile.school || profile.hometown) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Background</h3>
                <div className="space-y-1.5">
                  {profile.job_title && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{profile.job_title}</span>
                    </div>
                  )}
                  {profile.school && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{profile.school}</span>
                    </div>
                  )}
                  {profile.hometown && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Home className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>From {profile.hometown}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Prompt Responses */}
          {profile.prompt_responses.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Prompts</h3>
                <div className="space-y-3">
                  {profile.prompt_responses.map((response) => (
                    <div key={response.id} className="space-y-0.5">
                      <p className="text-sm font-medium text-gray-700">
                        {response.prompt.prompt}
                      </p>
                      <p className="text-sm text-gray-600">{response.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Interests */}
          {profile.interests.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Interests</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest) => (
                    <Badge key={interest.id} variant="secondary" className="text-xs">
                      {interest.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Activities */}
          {profile.activities.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Activities</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.activities.map((activity) => (
                    <Badge key={activity.id} variant="outline" className="text-xs">
                      {activity.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Account Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Account Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>{formatPhoneNumber(profile.user.phone)}</span>
              </div>
              {profile.user.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{profile.user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
              {profile.user.last_seen_at && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>Last seen {formatDateTime(profile.user.last_seen_at)}</span>
                </div>
              )}
              {profile.user.referral_code && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>Referral: {profile.user.referral_code}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile ID (for debugging) */}
          <div className="pt-2 text-xs text-gray-400">
            Profile ID: {profile.id}
          </div>
        </div>
      </div>
    </div>
  )
}
