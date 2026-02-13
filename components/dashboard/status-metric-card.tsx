'use client'

import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card } from '@/components/ui/card'

export interface StatusCount {
  label: string
  count: number
  color: string // hex color
}

interface StatusMetricCardProps {
  title: string
  value: number
  statuses: StatusCount[]
  className?: string
}

export function StatusMetricCard({
  title,
  value,
  statuses,
  className
}: StatusMetricCardProps) {
  return (
    <div className={cn('px-6 ', className)}>
      {/* Title row with info */}
      <div className="flex items-center justify-between mb-1">
        <span className="texts-label-medium text-(--text-secondary)">{title}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-0.5 hover:bg-teal-50 rounded transition-colors">
              <Info className="w-3.5 h-3.5 text-(--text-muted) hover:text-[#0d9488] transition-colors" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className="w-auto p-3 bg-white border border-gray-200 shadow-lg"
          >
            <p className="texts-label-small text-(--text-primary) mb-2">Status Breakdown</p>
            <div className="flex flex-col gap-1.5">
              {statuses.map((status) => (
                <div key={status.label} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="texts-caption-large text-(--text-secondary)">{status.label}</span>
                  </div>
                  <span className="texts-label-small text-(--text-primary)">{status.count}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Value */}
      <div className="mb-3">
        <span className="texts-heading-h1 text-(--text-primary)">
          {value}
        </span>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {statuses.map((status) => (
          <div
            key={status.label}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md"
            style={{ backgroundColor: `${status.color}14` }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: status.color }}
            />
            <span
              className="text-[11px] font-bold leading-none"
              style={{ color: status.color }}
            >
              {status.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatusMetricCardSkeleton() {
  return (
    <div className="px-6 py-5">
      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2" />
      <div className="h-9 w-16 bg-gray-100 rounded animate-pulse mb-2" />
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-gray-100 rounded-full animate-pulse" />
            <div className="w-4 h-3 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatusMetricsContainer({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <Card className={cn('gap-0 flex-row p-5 shadow-xs' , className)}>
      {children}
    </Card>
  )
}

export function StatusMetricsContainerSkeleton() {
  return (
    <Card className="py-0 gap-0 flex-row">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={cn('flex-1', i < 4 && 'border-r border-gray-200')}>
          <StatusMetricCardSkeleton />
        </div>
      ))}
    </Card>
  )
}
