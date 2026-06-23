'use client'

import { cn } from '@/lib/utils'

interface SummaryMetricStat {
  label: string
  value: number | string
  color: string // hex color
}

interface SummaryMetricCardProps {
  title: string
  value: string
  stats: SummaryMetricStat[]
  className?: string
}

export function SummaryMetricCard({
  title,
  value,
  stats,
  className,
}: SummaryMetricCardProps) {
  return (
    <div className={cn('px-6', className)}>
      {/* Title */}
      <div className="flex items-center justify-between mb-1">
        <span className="texts-label-medium text-(--text-secondary)">{title}</span>
      </div>

      {/* Value */}
      <div className="mb-3">
        <span className="texts-heading-h2 text-(--text-primary)">
          {value}
        </span>
      </div>

      {/* Stats badges — same style as StatusMetricCard */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md"
            style={{ backgroundColor: `${stat.color}14` }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: stat.color }}
            />
            <span
              className="texts-caption-large font-bold leading-none"
              style={{ color: stat.color }}
            >
              {stat.value} {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SummaryMetricCardSkeleton() {
  return (
    <div className="px-6">
      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2" />
      <div className="h-9 w-28 bg-gray-100 rounded animate-pulse mb-2" />
      <div className="flex items-center gap-1.5">
        {[1, 2].map((i) => (
          <div key={i} className="h-6 w-20 bg-gray-100 rounded-md animate-pulse" />
        ))}
      </div>
    </div>
  )
}
