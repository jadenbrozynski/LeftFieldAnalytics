"use client"

import { cn } from "@/lib/utils"

interface GenderBreakdownProps {
  men: number
  women: number
  nonbinary: number
  className?: string
}

export function GenderBreakdown({ men, women, nonbinary, className }: GenderBreakdownProps) {
  const total = men + women + nonbinary

  if (total === 0) {
    return null
  }

  const segments = [
    { label: 'Women', count: women, percent: (women / total) * 100, color: 'bg-pink-500', textColor: 'text-pink-600' },
    { label: 'Men', count: men, percent: (men / total) * 100, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { label: 'Non-binary', count: nonbinary, percent: (nonbinary / total) * 100, color: 'bg-purple-500', textColor: 'text-purple-600' },
  ].filter(s => s.count > 0)

  return (
    <div className={cn("grid grid-cols-3 gap-4", className)}>
      {segments.map((segment) => (
        <div
          key={segment.label}
          className="bg-white rounded-xl border border-border p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("h-3 w-3 rounded-full", segment.color)} />
            <span className="text-sm font-medium text-gray-600">{segment.label}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-semibold", segment.textColor)}>
              {segment.count.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400">
              {segment.percent.toFixed(1)}%
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", segment.color)}
              style={{ width: `${segment.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
