"use client"

import * as React from "react"
import Image from "next/image"
import { MapPin } from "lucide-react"
import { Profile } from "@/lib/types"
import { cn, getStatusColor, getGenderLabel } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface ProfileCardProps {
  profile: Profile
  onClick?: () => void
  className?: string
}

export function ProfileCard({ profile, onClick, className }: ProfileCardProps) {
  const primaryPhoto = profile.uploads.find((u) => u.display_order === 0) || profile.uploads[0]
  const location = profile.geolocation
    ? [profile.geolocation.city, profile.geolocation.region]
        .filter(Boolean)
        .join(", ")
    : profile.neighborhood

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="relative aspect-square bg-gray-100">
        {primaryPhoto ? (
          <Image
            src={primaryPhoto.url}
            alt={`${profile.first_name}'s photo`}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl font-semibold text-gray-300">
              {profile.first_name.charAt(0)}
            </span>
          </div>
        )}
        <Badge
          className={cn(
            "absolute top-2 right-2",
            getStatusColor(profile.status)
          )}
        >
          {profile.status}
        </Badge>
      </div>
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate">
            {profile.first_name}, {profile.age}
          </h3>
          <span className="text-xs text-gray-500">
            {getGenderLabel(profile.gender)}
          </span>
        </div>
        {location && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
