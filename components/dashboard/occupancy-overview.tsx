'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

export interface OccupancySegment {
  label: string
  count: number
  color: string
}

export interface OccupancyGroup {
  label: string
  total: number
  occupied: number
  segments: OccupancySegment[]
}

interface OccupancyOverviewProps {
  groups: OccupancyGroup[] // e.g. [Properties, Rooms]
  changeFromLastMonth: number // e.g. 2.4 means +2.4%
  months: { value: string; label: string }[]
  years: number[]
  selectedMonth: string
  selectedYear: number
  onMonthChange: (month: string) => void
  onYearChange: (year: number) => void
  className?: string
}

// ── Component ──────────────────────────────────────────────────────────

export function OccupancyOverview({
  groups,
  changeFromLastMonth,
  months,
  years,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  className,
}: OccupancyOverviewProps) {
  const totalOccupied = groups.reduce((sum, g) => sum + g.occupied, 0)
  const totalUnits = groups.reduce((sum, g) => sum + g.total, 0)
  const overallRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0

  const isPositive = changeFromLastMonth > 0
  const isNeutral = changeFromLastMonth === 0

  return (
    <Card className={cn('py-0 gap-0 flex-1', className)}>
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="texts-label-medium text-(--text-secondary)">
              Occupancy Overview
            </h3>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="texts-heading-h3 text-(--text-primary)">
                {overallRate}%
              </p>
              <div
                className={cn(
                  'flex items-center gap-0.5 px-1.5 py-0.5 rounded-md texts-caption-large font-bold',
                  isNeutral
                    ? 'bg-gray-50 text-gray-500'
                    : isPositive
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-600',
                )}
              >
                {isNeutral ? (
                  <Minus className="w-3 h-3" />
                ) : isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isNeutral ? '0%' : `${isPositive ? '+' : ''}${changeFromLastMonth}%`}
              </div>
              <span className="texts-caption-large text-(--text-muted)">vs last month</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={onMonthChange}>
              <SelectTrigger size="sm" className="w-[100px] texts-caption-large">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => onYearChange(Number(v))}
            >
              <SelectTrigger size="sm" className="w-[72px] texts-caption-large">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-5 flex flex-col gap-4">
        {groups.map((group) => {
          const rate = group.total > 0
            ? Math.round((group.occupied / group.total) * 100)
            : 0

          return (
            <div key={group.label}>
              {/* Group header */}
              <div className="flex items-center justify-between mb-2">
                <span className="texts-label-small text-(--text-secondary)">
                  {group.label}
                </span>
                <span className="texts-label-small text-(--text-primary)">
                  {group.occupied}/{group.total} occupied ({rate}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-(--background-tertiary) rounded-full overflow-hidden flex">
                {group.segments.map((seg) => {
                  const pct = group.total > 0 ? (seg.count / group.total) * 100 : 0
                  return (
                    <div
                      key={seg.label}
                      className="h-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: seg.color }}
                    />
                  )
                })}
              </div>

              {/* Breakdown grid */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {group.segments.map((seg) => {
                  const pct = group.total > 0
                    ? Math.round((seg.count / group.total) * 100)
                    : 0
                  return (
                    <div
                      key={seg.label}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: `${seg.color}0a` }}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="texts-caption-large text-(--text-muted) truncate block">
                          {seg.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 shrink-0">
                        <span
                          className="texts-label-small font-bold"
                          style={{ color: seg.color }}
                        >
                          {seg.count}
                        </span>
                        <span className="texts-caption-large text-(--text-muted)">
                          ({pct}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────

export function OccupancyOverviewSkeleton() {
  return (
    <Card className="py-0 gap-0 flex-1">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-7 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-[100px] bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-[72px] bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-5 flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-2">
              <div className="h-3.5 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-3.5 w-36 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full animate-pulse mb-3" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
