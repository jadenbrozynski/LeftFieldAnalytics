import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

export interface StatItem {
  label: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: LucideIcon
}

interface StatsRowProps {
  stats: StatItem[]
  className?: string
}

export function StatsRow({ stats, className }: StatsRowProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((stat, index) => (
        <Card key={index} className="p-6 bg-white border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString()
                  : stat.value}
              </p>
              {stat.change && (
                <p
                  className={cn(
                    "text-xs font-medium",
                    stat.changeType === "positive" && "text-green-600",
                    stat.changeType === "negative" && "text-red-600",
                    stat.changeType === "neutral" && "text-gray-500"
                  )}
                >
                  {stat.change}
                </p>
              )}
            </div>
            {stat.icon && (
              <div className="rounded-lg bg-[#00433a]/10 p-3">
                <stat.icon className="h-5 w-5 text-[#00433a]" />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
