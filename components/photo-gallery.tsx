"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play, Expand } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProfileUpload } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ImageLightbox } from "@/components/image-lightbox"

interface PhotoGalleryProps {
  uploads: ProfileUpload[]
  className?: string
  compact?: boolean
}

export function PhotoGallery({ uploads, className, compact = false }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)

  const sortedUploads = [...uploads].sort((a, b) => a.display_order - b.display_order)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? sortedUploads.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === sortedUploads.length - 1 ? 0 : prev + 1))
  }

  if (sortedUploads.length === 0) {
    return (
      <div className={cn(
        "relative bg-gray-100 rounded-xl flex items-center justify-center",
        compact ? "aspect-square" : "aspect-[3/4]",
        className
      )}>
        <span className="text-gray-400">No photos</span>
      </div>
    )
  }

  const currentUpload = sortedUploads[currentIndex]

  return (
    <div className={cn("space-y-2", className)}>
      {/* Main Image */}
      <div className={cn(
        "relative bg-gray-100 rounded-xl overflow-hidden group",
        compact ? "aspect-square" : "aspect-[3/4]"
      )}>
        {currentUpload.type === "video" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <video
              src={currentUpload.url}
              className="max-h-full max-w-full object-contain"
              controls
            />
          </div>
        ) : (
          <Image
            src={currentUpload.url}
            alt={`Photo ${currentIndex + 1}`}
            fill
            className="object-cover"
            unoptimized
          />
        )}

        {/* Navigation Arrows */}
        {sortedUploads.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className={cn(
                "absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow-sm",
                compact ? "h-6 w-6" : "h-8 w-8"
              )}
            >
              <ChevronLeft className={compact ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow-sm",
                compact ? "h-6 w-6" : "h-8 w-8"
              )}
            >
              <ChevronRight className={compact ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
          </>
        )}

        {/* Expand button */}
        {currentUpload.type !== "video" && (
          <button
            onClick={() => setLightboxOpen(true)}
            className={cn(
              "absolute bottom-2 right-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-opacity",
              compact ? "p-1 opacity-0 group-hover:opacity-100" : "p-1.5"
            )}
            title="Expand image"
          >
            <Expand className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </button>
        )}

        {/* Dots Indicator */}
        {sortedUploads.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {sortedUploads.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "rounded-full transition-all",
                  compact ? "h-1 w-1" : "h-1.5",
                  index === currentIndex
                    ? (compact ? "w-2 bg-white" : "w-4 bg-white")
                    : (compact ? "bg-white/60 hover:bg-white/80" : "w-1.5 bg-white/60 hover:bg-white/80")
                )}
              />
            ))}
          </div>
        )}

        {/* Video Indicator */}
        {currentUpload.type === "video" && (
          <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
            <Play className={cn("text-white fill-white", compact ? "h-2 w-2" : "h-3 w-3")} />
          </div>
        )}

        {/* Photo counter */}
        {sortedUploads.length > 1 && (
          <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-0.5 text-xs text-white">
            {currentIndex + 1}/{sortedUploads.length}
          </div>
        )}
      </div>

      {/* Thumbnails - Show if more than 1 image */}
      {sortedUploads.length > 1 && (
        <div className={cn(
          "flex gap-1.5 overflow-x-auto pb-1",
          compact && "mt-2"
        )}>
          {sortedUploads.map((upload, index) => (
            <button
              key={upload.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative flex-shrink-0 rounded-md overflow-hidden",
                compact ? "h-10 w-10" : "h-14 w-14 rounded-lg",
                index === currentIndex
                  ? "ring-2 ring-primary ring-offset-1"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              {upload.type === "video" ? (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <Play className={cn("text-gray-500", compact ? "h-2 w-2" : "h-3 w-3")} />
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

      {/* Lightbox */}
      {currentUpload.type !== "video" && (
        <ImageLightbox
          src={currentUpload.url}
          alt={`Photo ${currentIndex + 1}`}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}
    </div>
  )
}
