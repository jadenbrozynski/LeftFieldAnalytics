import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface DropStatCardProps {
  label: string
  value: number
  previousValue?: number
  format?: 'number' | 'percent' | 'decimal'
  icon?: LucideIcon
  className?: string
}

export function DropStatCard({
  label,
  value,
  previousValue,
  format = 'number',
  icon: Icon,
  className,
}: DropStatCardProps) {
  const formatValue = (val: number) => {
    if (format === 'percent') {
      return `${(val * 100).toFixed(1)}%`
    }
    if (format === 'decimal') {
      return val.toFixed(1)
    }
    return val.toLocaleString()
  }

  const getTrend = () => {
    if (previousValue === undefined || previousValue === 0) return null
    const change = ((value - previousValue) / previousValue) * 100
    if (Math.abs(change) < 0.1) return null
    return {
      direction: change > 0 ? 'up' : 'down',
      value: Math.abs(change).toFixed(1),
    }
  }

  const trend = getTrend()

  return (
    <Card className={cn("p-4 bg-white border-border", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatValue(value)}
          </p>
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend.direction === 'up' ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}% from previous
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-[#00433a]/10 p-2.5">
            <Icon className="h-5 w-5 text-[#00433a]" />
          </div>
        )}
      </div>
    </Card>
  )
}
