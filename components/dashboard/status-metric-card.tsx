'use client'

import { cn } from '@/lib/utils'
import { Info, Building2, DoorOpen, FileText, ScrollText } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'

const ICONS = {
  Building2,
  DoorOpen,
  FileText,
  ScrollText
} as const

type IconName = keyof typeof ICONS

export interface StatusCount {
  label: string
  count: number
  color: string // hex color
}

interface StatusMetricCardProps {
  title: string
  value: number
  icon: IconName
  statuses: StatusCount[]
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  className?: string
}

const variantStyles = {
  default: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  success: {
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  danger: {
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  purple: {
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  }
}

export function StatusMetricCard({
  title,
  value,
  icon,
  statuses,
  variant = 'default',
  className
}: StatusMetricCardProps) {
  const styles = variantStyles[variant]
  const Icon = ICONS[icon]

  return (
    <Card className={cn('py-0 gap-0', className)}>
      <CardContent className="p-4">
        {/* Top row: Icon and Info popover */}
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl',
              styles.iconBg
            )}
          >
            <Icon className={cn('w-5 h-5', styles.iconColor)} strokeWidth={2} />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                <Info className="w-4 h-4 text-gray-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              className="w-auto p-3 bg-white border border-gray-200 shadow-lg"
            >
              <p className="text-xs font-semibold text-gray-900 mb-2">Status Legend</p>
              <div className="flex flex-col gap-1.5">
                {statuses.map((status) => (
                  <div key={status.label} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-xs text-gray-600">{status.label}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Value */}
        <div className="mb-0.5">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            {value}
          </span>
        </div>

        {/* Title */}
        <div className="text-sm font-medium text-gray-500 mb-2">
          {title}
        </div>

        {/* Status dots with counts */}
        <div className="flex items-center gap-3 flex-wrap">
          {statuses.map((status) => (
            <div key={status.label} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span className="text-xs font-medium text-gray-600">
                {status.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function StatusMetricCardSkeleton() {
  return (
    <Card className="py-0 gap-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div className="w-6 h-6 bg-gray-100 rounded-md animate-pulse" />
        </div>
        <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mb-1" />
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2" />
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-gray-100 rounded-full animate-pulse" />
              <div className="w-4 h-3 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
